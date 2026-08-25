import { ensureSchema } from "@/db";
import { requirePilotUser } from "@/app/lib/auth";
import { readLimitedJson, requireSameOrigin } from "@/app/lib/http";
import { ensureToolsSeeded } from "@/app/lib/tool-catalog";
import { enforceWriteRateLimit } from "@/app/lib/rate-limit";

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const originError = requireSameOrigin(request);
    if (originError) return originError;
    const user = await requirePilotUser(request);
    const db = await ensureSchema();
    await ensureToolsSeeded(db);
    const { id } = await params;
    const body = await readLimitedJson(request, 1000);
    const stars = Number(body.stars);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5)
      return json({ error: "Choose a whole-number rating from 1 to 5." }, 422);
    const tool = await db
      .prepare(`SELECT id FROM tools WHERE id=?`)
      .bind(id)
      .first();
    if (!tool) return json({ error: "Tool not found." }, 404);
    const existing = await db
      .prepare(`SELECT stars FROM tool_ratings WHERE tool_id=? AND user_id=?`)
      .bind(id, user.userId)
      .first<{ stars: number }>();
    if (existing?.stars === stars) {
      const aggregate = await db
        .prepare(
          `SELECT ROUND(AVG(stars),1) AS ratingAverage,COUNT(*) AS ratingCount FROM tool_ratings WHERE tool_id=?`,
        )
        .bind(id)
        .first();
      return json({ ...aggregate, userRating: stars });
    }
    const rateError = await enforceWriteRateLimit(
      db,
      request,
      user.userId,
      "tool_rating",
      30,
    );
    if (rateError) return rateError;
    await db.batch([
      db
        .prepare(
          `INSERT INTO tool_ratings (tool_id,user_id,stars) VALUES (?,?,?) ON CONFLICT(tool_id,user_id) DO UPDATE SET stars=excluded.stars,updated_at=CURRENT_TIMESTAMP`,
        )
        .bind(id, user.userId, stars),
      db
        .prepare(
          `INSERT INTO audit_log (actor_user_id,action,entity_type,entity_id,detail) VALUES (?,'tool.rating.saved','tool',?,'Community usefulness rating saved')`,
        )
        .bind(user.userId, id),
    ]);
    const aggregate = await db
      .prepare(
        `SELECT ROUND(AVG(stars),1) AS ratingAverage,COUNT(*) AS ratingCount FROM tool_ratings WHERE tool_id=?`,
      )
      .bind(id)
      .first();
    return json({ ...aggregate, userRating: stars });
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: "Unable to save the rating." }, 500);
  }
}
