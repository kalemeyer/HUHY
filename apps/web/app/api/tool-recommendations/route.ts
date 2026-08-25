import { ensureSchema } from "@/db";
import {
  getOptionalPilotUser,
  isTriageRole,
  requirePilotUser,
} from "@/app/lib/auth";
import { readLimitedJson, requireSameOrigin } from "@/app/lib/http";
import { enforceWriteRateLimit } from "@/app/lib/rate-limit";

const relationships = new Set([
  "Community recommendation",
  "I maintain this tool",
  "I contribute to this tool",
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
function publicUrl(value: unknown, required: boolean): string | null {
  const raw = text(value, 500);
  if (!raw) return required ? null : "";
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^(127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
        host,
      )
    )
      return null;
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const user = await requirePilotUser(request);
    if (!isTriageRole(user.role))
      return json({ error: "Steward or triager access is required." }, 403);
    const db = await ensureSchema();
    const rows = await db
      .prepare(
        `SELECT id,name,website,repository,category,relationship,use_case AS useCase,maintainer,license,review_notes AS reviewNotes,status,decision_note AS decisionNote,listed_tool_id AS listedToolId,created_at AS createdAt,updated_at AS updatedAt FROM tool_recommendations ORDER BY CASE status WHEN 'Pending review' THEN 0 ELSE 1 END, created_at DESC`,
      )
      .all();
    return json({ recommendations: rows.results });
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: "Unable to load tool recommendations." }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;
    const body = await readLimitedJson(request, 7000);
    if (text(body.companyWebsite, 200))
      return json(
        {
          id: "RECEIVED",
          status: "Pending review",
          message: "Recommendation received for review.",
        },
        202,
      );
    const name = text(body.name, 120),
      website = publicUrl(body.website, true),
      repository = publicUrl(body.repository, false),
      category = text(body.category, 80),
      relationship = text(body.relationship, 40),
      useCase = text(body.useCase, 500),
      maintainer = text(body.maintainer, 160),
      license = text(body.license, 120),
      reviewNotes = text(body.reviewNotes, 400);
    if (
      name.length < 2 ||
      !website ||
      repository === null ||
      category.length < 2 ||
      !relationships.has(relationship) ||
      useCase.length < 20 ||
      body.safetyConfirmed !== true
    )
      return json(
        {
          error:
            "Complete the required fields with valid public web links and confirm the public-information boundary.",
        },
        422,
      );
    if (
      unsafePattern.test(
        [name, category, useCase, maintainer, license, reviewNotes].join(" "),
      )
    )
      return json(
        {
          error:
            "This recommendation may contain sensitive, controlled, credential, or personal information. Nothing was saved.",
        },
        422,
      );
    const user = await getOptionalPilotUser(request);
    const db = await ensureSchema();
    const rateError = await enforceWriteRateLimit(
      db,
      request,
      user?.userId ?? null,
      "tool_recommendation",
      10,
    );
    if (rateError) return rateError;
    const existingTool = await db
      .prepare(
        `SELECT id FROM tools WHERE website=? OR (? != '' AND github=?) LIMIT 1`,
      )
      .bind(website, repository || "", repository || "")
      .first();
    if (existingTool)
      return json(
        { error: "That tool or repository is already in the directory." },
        409,
      );
    const pending = await db
      .prepare(
        `SELECT id FROM tool_recommendations WHERE website=? AND status='Pending review' LIMIT 1`,
      )
      .bind(website)
      .first();
    if (pending)
      return json({ error: "That tool is already waiting for review." }, 409);
    const id = `TOOL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await db.batch([
      db
        .prepare(
          `INSERT INTO tool_recommendations (id,submitter_user_id,name,website,repository,category,relationship,use_case,maintainer,license,review_notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .bind(
          id,
          user?.userId ?? null,
          name,
          website,
          repository || null,
          category,
          relationship,
          useCase,
          maintainer || null,
          license || null,
          reviewNotes || null,
        ),
      ...(user
        ? [
            db
              .prepare(
                `INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,detail) VALUES (?,'tool_recommendation.created','tool_recommendation',?,'Public links and descriptive metadata submitted; body omitted from audit log')`,
              )
              .bind(user.userId, id),
          ]
        : []),
    ]);
    return json(
      {
        id,
        status: "Pending review",
        message:
          "Saved to the private tool review queue. Nothing was published automatically.",
      },
      201,
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: "Unable to save the recommendation." }, 500);
  }
}
