import { toolCatalog } from "@/app/data";

const catalogSeedVersion = "2026-08-25-external-projects-1";

export async function ensureToolsSeeded(db: D1Database): Promise<void> {
  const seeded = await db
    .prepare(`SELECT value FROM app_metadata WHERE key='tool_catalog_seed'`)
    .first<{ value: string }>();
  if (seeded?.value === catalogSeedVersion) return;
  await db.batch([
    ...toolCatalog.map((tool) =>
      db
        .prepare(
          `
    INSERT INTO tools (id,name,category,platform,ownership,maintainer,source,repository_status,license,huhy_role,lifecycle,maintenance,website,github,note,evidence_as_of)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,category=excluded.category,platform=excluded.platform,ownership=excluded.ownership,maintainer=excluded.maintainer,source=excluded.source,repository_status=excluded.repository_status,license=excluded.license,huhy_role=excluded.huhy_role,lifecycle=excluded.lifecycle,maintenance=excluded.maintenance,website=excluded.website,github=excluded.github,note=excluded.note,evidence_as_of=excluded.evidence_as_of
  `,
        )
        .bind(
          tool.id,
          tool.name,
          tool.category,
          tool.platform,
          tool.ownership,
          tool.maintainer,
          tool.source,
          tool.repositoryStatus,
          tool.license,
          tool.huhyRole,
          tool.lifecycle,
          tool.maintenance,
          tool.website,
          tool.github,
          tool.note,
          tool.evidenceAsOf,
        ),
    ),
    db
      .prepare(
        `INSERT INTO app_metadata (key,value) VALUES ('tool_catalog_seed',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP`,
      )
      .bind(catalogSeedVersion),
  ]);
}
