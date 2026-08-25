import { ensureSchema } from "@/db";
import { getOptionalPilotUser, requirePilotUser } from "@/app/lib/auth";
import { readLimitedJson, requireSameOrigin } from "@/app/lib/http";
import {
  getGitHubConfig,
  syncSubmissionsFromGitHub,
  type SyncableSubmission,
} from "@/app/lib/github";
import { enforceWriteRateLimit } from "@/app/lib/rate-limit";

const frequencies = new Set([
  "Occasionally",
  "Monthly",
  "Weekly",
  "Daily",
  "Not sure",
]);
const unsafePattern =
  /(BEGIN [A-Z ]*PRIVATE KEY|api[_ -]?key|password\s*[:=]|secret\s*[:=]|token\s*[:=]|AKIA[0-9A-Z]{16}|\b\d{3}-\d{2}-\d{4}\b|\bCUI\b|\bFOUO\b|\bCLASSIFIED\b)/i;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const board = url.searchParams.get("scope") === "board";
    const user = board
      ? await getOptionalPilotUser(request)
      : await requirePilotUser(request);
    const db = await ensureSchema();
    const publicFields = `id,public_problem AS problem,public_people AS people,public_current_today AS currentToday,public_better AS better,public_frequency AS frequency,public_existing_tool AS existingTool,status,source_status AS sourceStatus,risk,maintainer,contributor_needs AS contributorNeeds,maintenance_status AS maintenanceStatus,review_cadence AS reviewCadence,github_url AS githubUrl,github_issue_number AS githubIssueNumber,github_updated_at AS githubUpdatedAt,github_checked_at AS githubCheckedAt,disposition_reason AS dispositionReason,reopening_condition AS reopeningCondition,created_at AS createdAt,updated_at AS updatedAt`;
    const privateFields = `author_id AS authorId,id,problem,people,current_today AS currentToday,better,frequency,existing_tool AS existingTool,public_problem AS publicProblem,public_people AS publicPeople,public_current_today AS publicCurrentToday,public_better AS publicBetter,public_frequency AS publicFrequency,public_existing_tool AS publicExistingTool,public_brief_approved_at AS publicBriefApprovedAt,status,source_status AS sourceStatus,risk,maintainer,contributor_needs AS contributorNeeds,maintenance_status AS maintenanceStatus,review_cadence AS reviewCadence,github_url AS githubUrl,github_issue_number AS githubIssueNumber,github_updated_at AS githubUpdatedAt,github_checked_at AS githubCheckedAt,disposition_reason AS dispositionReason,reopening_condition AS reopeningCondition,created_at AS createdAt,updated_at AS updatedAt`;
    const where = board
      ? `WHERE public_brief_approved_at IS NOT NULL AND status NOT IN ('Pending review','Removed')`
      : user!.role === "steward" || user!.role === "triager"
        ? ""
        : `WHERE author_id = ?`;
    const statement = db.prepare(
      `SELECT ${board ? publicFields : privateFields} FROM submissions ${where} ORDER BY created_at DESC`,
    );
    const rows = await (
      where.includes("?") ? statement.bind(user!.userId) : statement
    ).all();
    const submissions = await syncSubmissionsFromGitHub(
      db,
      rows.results as unknown as SyncableSubmission[],
    );
    const github = getGitHubConfig();
    return json({
      submissions,
      user: user ? { displayName: user.displayName, role: user.role } : null,
      github: {
        configured: github.configured,
        repository: github.repository,
        url: github.url,
        syncMode: "Live refresh from GitHub labels",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: "Unable to load submissions." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;
    const user = await getOptionalPilotUser(request);
    const db = await ensureSchema();
    const body = await readLimitedJson(request, 8000);
    if (text(body.companyWebsite, 200))
      return json(
        {
          id: "RECEIVED",
          status: "Pending review",
          message: "Submission received for review.",
        },
        202,
      );
    const problem = text(body.problem, 500),
      people = text(body.people, 160),
      currentToday = text(body.currentToday, 500),
      better = text(body.better, 320),
      frequency = text(body.frequency, 30),
      existingTool = text(body.existingTool, 240);
    if (
      problem.length < 20 ||
      people.length < 3 ||
      currentToday.length < 10 ||
      better.length < 10 ||
      !frequencies.has(frequency) ||
      body.safetyConfirmed !== true
    )
      return json(
        {
          error:
            "Complete every required field and confirm the public-information boundary.",
        },
        422,
      );
    if (
      unsafePattern.test(
        [problem, people, currentToday, better, existingTool].join(" "),
      )
    )
      return json(
        {
          error:
            "This entry may contain sensitive, controlled, credential, or personal information. Nothing was saved. Remove those details and describe only the general public pattern.",
        },
        422,
      );
    const rateError = await enforceWriteRateLimit(
      db,
      request,
      user?.userId ?? null,
      "problem_submission",
      5,
    );
    if (rateError) return rateError;
    const actor = user ?? {
      userId: "public-anonymous",
      email: "anonymous@huhy.invalid",
      displayName: "Anonymous public submission",
      role: "member" as const,
    };
    if (!user)
      await db
        .prepare(
          `INSERT INTO users (id,email,display_name,role) VALUES (?,?,?,'member') ON CONFLICT(id) DO NOTHING`,
        )
        .bind(actor.userId, actor.email, actor.displayName)
        .run();
    const id = `HUHY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await db.batch([
      db
        .prepare(
          `INSERT INTO submissions (id,author_id,problem,people,current_today,better,frequency,existing_tool) VALUES (?,?,?,?,?,?,?,?)`,
        )
        .bind(
          id,
          actor.userId,
          problem,
          people,
          currentToday,
          better,
          frequency,
          existingTool || null,
        ),
      db
        .prepare(
          `INSERT INTO disposition_events (submission_id,from_status,to_status,actor_user_id,reason) VALUES (?,NULL,'Pending review',?,'Submitted to the safety review queue')`,
        )
        .bind(id, actor.userId),
      db
        .prepare(
          `INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,detail) VALUES (?,'submission.created','submission',?,'Safety-review intake created; body intentionally omitted from audit log')`,
        )
        .bind(actor.userId, id),
    ]);
    return json(
      {
        id,
        status: "Pending review",
        message:
          "Saved to the private safety review queue. It will appear publicly only after review.",
      },
      201,
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: "Unable to save the submission." }, 500);
  }
}
