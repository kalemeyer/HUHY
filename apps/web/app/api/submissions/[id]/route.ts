import { ensureSchema } from "@/db";
import { isTriageRole, requirePilotUser } from "@/app/lib/auth";
import { requireSameOrigin } from "@/app/lib/http";
import {
  createGitHubIssue,
  GitHubConnectionError,
  updateGitHubIssue,
  type SyncableSubmission,
} from "@/app/lib/github";

const statuses = new Set([
  "Submitted",
  "Clarifying",
  "Researching",
  "Ready for Decision",
  "Approved for Incubation",
  "Building",
  "Released",
  "Not Now",
  "Referred",
  "Declined",
]);
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;
    const user = await requirePilotUser(request);
    if (!isTriageRole(user.role))
      return json({ error: "Steward or triager access is required." }, 403);
    const db = await ensureSchema();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const status = text(body.status, 40),
      reason = text(body.reason, 600),
      reopeningCondition = text(body.reopeningCondition, 600);
    if (!statuses.has(status))
      return json({ error: "Choose a valid disposition." }, 422);
    if (status === "Declined" && user.role !== "steward")
      return json(
        { error: "Only the named HUHY Steward may decline a viable proposal." },
        403,
      );
    if (
      ["Not Now", "Referred", "Declined"].includes(status) &&
      reason.length < 10
    )
      return json({ error: "Add a clear reason for this disposition." }, 422);
    if (status === "Declined" && reopeningCondition.length < 10)
      return json(
        { error: "A declined proposal needs a reopening condition." },
        422,
      );
    const current = await db
      .prepare(
        `SELECT id,problem,people,current_today AS currentToday,better,frequency,existing_tool AS existingTool,public_problem AS publicProblem,public_people AS publicPeople,public_current_today AS publicCurrentToday,public_better AS publicBetter,public_frequency AS publicFrequency,public_existing_tool AS publicExistingTool,public_brief_approved_at AS publicBriefApprovedAt,status,source_status AS sourceStatus,risk,maintainer,contributor_needs AS contributorNeeds,maintenance_status AS maintenanceStatus,review_cadence AS reviewCadence,github_url AS githubUrl,github_issue_number AS githubIssueNumber,github_updated_at AS githubUpdatedAt,github_checked_at AS githubCheckedAt FROM submissions WHERE id=?`,
      )
      .bind(id)
      .first<
        SyncableSubmission & {
          publicProblem: string | null;
          publicPeople: string | null;
          publicCurrentToday: string | null;
          publicBetter: string | null;
          publicFrequency: string | null;
          publicExistingTool: string | null;
          publicBriefApprovedAt: string | null;
        }
      >();
    if (!current) return json({ error: "Submission not found." }, 404);
    const publicProblem = text(body.publicProblem, 500),
      publicPeople = text(body.publicPeople, 160),
      publicCurrentToday = text(body.publicCurrentToday, 500),
      publicBetter = text(body.publicBetter, 320),
      publicFrequency = text(body.publicFrequency, 30),
      publicExistingTool = text(body.publicExistingTool, 240);
    if (
      publicProblem.length < 20 ||
      publicPeople.length < 3 ||
      publicCurrentToday.length < 10 ||
      publicBetter.length < 10 ||
      !frequencies.has(publicFrequency) ||
      body.publicBriefConfirmed !== true
    )
      return json(
        {
          error:
            "Review every public-brief field and confirm that this exact brief may be published.",
        },
        422,
      );
    if (
      unsafePattern.test(
        [
          publicProblem,
          publicPeople,
          publicCurrentToday,
          publicBetter,
          publicExistingTool,
        ].join(" "),
      )
    )
      return json(
        {
          error:
            "The public brief may contain sensitive, controlled, credential, or personal information. Remove those details before publishing.",
        },
        422,
      );
    const sourceStatus = text(body.sourceStatus, 160) || current.sourceStatus,
      risk = text(body.risk, 20) || current.risk,
      maintainer = text(body.maintainer, 160) || current.maintainer,
      contributorNeeds =
        text(body.contributorNeeds, 240) || current.contributorNeeds,
      maintenanceStatus =
        text(body.maintenanceStatus, 40) || current.maintenanceStatus,
      reviewCadence = text(body.reviewCadence, 120) || current.reviewCadence;
    if (!["Unreviewed", "Low", "Medium", "High"].includes(risk))
      return json({ error: "Choose a valid risk level." }, 422);
    if (
      ![
        "Maintained",
        "Primary maintainer needed",
        "Backup maintainer needed",
        "Maintainer needed",
      ].includes(maintenanceStatus)
    )
      return json({ error: "Choose a valid maintenance status." }, 422);
    const approved = {
      ...current,
      problem: publicProblem,
      people: publicPeople,
      currentToday: publicCurrentToday,
      better: publicBetter,
      frequency: publicFrequency,
      existingTool: publicExistingTool || null,
      status,
      sourceStatus,
      risk,
      maintainer,
      contributorNeeds,
      maintenanceStatus,
      reviewCadence,
    };
    let githubUrl = current.githubUrl,
      githubIssueNumber = current.githubIssueNumber,
      githubUpdatedAt = current.githubUpdatedAt;
    let githubAction = "";
    if (!current.githubIssueNumber && status === "Approved for Incubation") {
      if (body.publishToGitHub !== true)
        return json(
          {
            error:
              "Confirm that the approved public brief may be published to the public GitHub repository.",
          },
          422,
        );
      try {
        const issue = await createGitHubIssue(approved);
        githubUrl = issue.html_url;
        githubIssueNumber = issue.number;
        githubUpdatedAt = issue.updated_at;
        githubAction = "Created the public GitHub issue.";
      } catch (error) {
        if (error instanceof GitHubConnectionError)
          return json({ error: error.message }, error.status);
        throw error;
      }
    } else if (current.githubIssueNumber) {
      try {
        const issue = await updateGitHubIssue(
          current.githubIssueNumber,
          approved,
        );
        githubUrl = issue.html_url;
        githubUpdatedAt = issue.updated_at;
        githubAction = "Updated the GitHub project brief and status label.";
      } catch (error) {
        if (error instanceof GitHubConnectionError)
          return json({ error: error.message }, error.status);
        throw error;
      }
    }
    await db.batch([
      db
        .prepare(
          `UPDATE submissions SET status=?,source_status=?,risk=?,maintainer=?,contributor_needs=?,maintenance_status=?,review_cadence=?,public_problem=?,public_people=?,public_current_today=?,public_better=?,public_frequency=?,public_existing_tool=?,public_brief_approved_at=CURRENT_TIMESTAMP,public_brief_approved_by=?,github_url=?,github_issue_number=?,github_updated_at=?,github_checked_at=NULL,disposition_reason=?,reopening_condition=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        )
        .bind(
          status,
          sourceStatus,
          risk,
          maintainer,
          contributorNeeds,
          maintenanceStatus,
          reviewCadence,
          publicProblem,
          publicPeople,
          publicCurrentToday,
          publicBetter,
          publicFrequency,
          publicExistingTool || null,
          user.userId,
          githubUrl,
          githubIssueNumber,
          githubUpdatedAt,
          reason || null,
          reopeningCondition || null,
          id,
        ),
      db
        .prepare(
          `INSERT INTO disposition_events (submission_id,from_status,to_status,actor_user_id,reason,reopening_condition) VALUES (?,?,?,?,?,?)`,
        )
        .bind(
          id,
          current.status,
          status,
          user.userId,
          reason || null,
          reopeningCondition || null,
        ),
      db
        .prepare(
          `INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,detail) VALUES (?,'submission.disposition.changed','submission',?,?)`,
        )
        .bind(user.userId, id, `${current.status} -> ${status}`),
    ]);
    return json({
      id,
      status,
      githubUrl,
      message: githubAction || "Disposition saved to the HUHY review record.",
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: "Unable to update the disposition." }, 500);
  }
}
