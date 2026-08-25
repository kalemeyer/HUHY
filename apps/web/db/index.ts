import { env } from "cloudflare:workers";

export function getDb(): D1Database {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  return env.DB;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, email TEXT NOT NULL, display_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('member','triager','maintainer','steward')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_single_steward ON users(role) WHERE role = 'steward'`,
  `CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY NOT NULL, author_id TEXT NOT NULL REFERENCES users(id), problem TEXT NOT NULL, people TEXT NOT NULL, current_today TEXT NOT NULL, better TEXT NOT NULL, frequency TEXT NOT NULL, existing_tool TEXT, status TEXT NOT NULL DEFAULT 'Pending review', source_status TEXT NOT NULL DEFAULT 'Source research needed', risk TEXT NOT NULL DEFAULT 'Unreviewed', maintainer TEXT NOT NULL DEFAULT 'Unassigned', contributor_needs TEXT NOT NULL DEFAULT 'Not defined', maintenance_status TEXT NOT NULL DEFAULT 'Maintainer needed', review_cadence TEXT NOT NULL DEFAULT 'Set during incubation', github_url TEXT, github_issue_number INTEGER, github_updated_at TEXT, github_checked_at TEXT, public_problem TEXT, public_people TEXT, public_current_today TEXT, public_better TEXT, public_frequency TEXT, public_existing_tool TEXT, public_brief_approved_at TEXT, public_brief_approved_by TEXT REFERENCES users(id), disposition_reason TEXT, reopening_condition TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_submissions_status_created ON submissions(status, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_submissions_author_created ON submissions(author_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS disposition_events (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE, from_status TEXT, to_status TEXT NOT NULL, actor_user_id TEXT NOT NULL REFERENCES users(id), reason TEXT, reopening_condition TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_disposition_submission_created ON disposition_events(submission_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS tools (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, category TEXT NOT NULL, platform TEXT NOT NULL, ownership TEXT NOT NULL, maintainer TEXT NOT NULL, source TEXT NOT NULL, repository_status TEXT NOT NULL, license TEXT NOT NULL, huhy_role TEXT NOT NULL, lifecycle TEXT NOT NULL, maintenance TEXT NOT NULL, website TEXT, github TEXT, note TEXT NOT NULL, evidence_as_of TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS tool_ratings (tool_id TEXT NOT NULL REFERENCES tools(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(tool_id,user_id))`,
  `CREATE INDEX IF NOT EXISTS idx_tool_ratings_tool ON tool_ratings(tool_id)`,
  `CREATE TABLE IF NOT EXISTS tool_recommendations (id TEXT PRIMARY KEY NOT NULL, submitter_user_id TEXT REFERENCES users(id), name TEXT NOT NULL, website TEXT NOT NULL, repository TEXT, category TEXT NOT NULL, relationship TEXT NOT NULL CHECK(relationship IN ('Community recommendation','I maintain this tool','I contribute to this tool')), use_case TEXT NOT NULL, maintainer TEXT, license TEXT, review_notes TEXT, status TEXT NOT NULL DEFAULT 'Pending review' CHECK(status IN ('Pending review','Duplicate','Referred to owner','Not listed','Listed')), reviewer_user_id TEXT REFERENCES users(id), decision_note TEXT, listed_tool_id TEXT REFERENCES tools(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_tool_recommendations_status_created ON tool_recommendations(status, created_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_tool_recommendations_pending_website ON tool_recommendations(website) WHERE status = 'Pending review'`,
  `CREATE TABLE IF NOT EXISTS write_rate_limits (bucket TEXT NOT NULL, action TEXT NOT NULL, window_start INTEGER NOT NULL, count INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(bucket,action,window_start))`,
  `CREATE TABLE IF NOT EXISTS app_metadata (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, actor_user_id TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_entity_created ON audit_log(entity_type, entity_id, created_at)`,
];

let ready: Promise<void> | null = null;

export async function ensureSchema(): Promise<D1Database> {
  const db = getDb();
  ready ??= (async () => {
    for (const statement of schemaStatements) await db.prepare(statement).run();
    const columns = await db
      .prepare(`PRAGMA table_info(submissions)`)
      .all<{ name: string }>();
    const names = new Set(columns.results.map((column) => column.name));
    if (!names.has("github_issue_number"))
      await db
        .prepare(
          `ALTER TABLE submissions ADD COLUMN github_issue_number INTEGER`,
        )
        .run();
    if (!names.has("github_updated_at"))
      await db
        .prepare(`ALTER TABLE submissions ADD COLUMN github_updated_at TEXT`)
        .run();
    if (!names.has("github_checked_at"))
      await db
        .prepare(`ALTER TABLE submissions ADD COLUMN github_checked_at TEXT`)
        .run();
    if (!names.has("public_problem"))
      await db
        .prepare(`ALTER TABLE submissions ADD COLUMN public_problem TEXT`)
        .run();
    if (!names.has("public_people"))
      await db
        .prepare(`ALTER TABLE submissions ADD COLUMN public_people TEXT`)
        .run();
    if (!names.has("public_current_today"))
      await db
        .prepare(`ALTER TABLE submissions ADD COLUMN public_current_today TEXT`)
        .run();
    if (!names.has("public_better"))
      await db
        .prepare(`ALTER TABLE submissions ADD COLUMN public_better TEXT`)
        .run();
    if (!names.has("public_frequency"))
      await db
        .prepare(`ALTER TABLE submissions ADD COLUMN public_frequency TEXT`)
        .run();
    if (!names.has("public_existing_tool"))
      await db
        .prepare(`ALTER TABLE submissions ADD COLUMN public_existing_tool TEXT`)
        .run();
    if (!names.has("public_brief_approved_at"))
      await db
        .prepare(
          `ALTER TABLE submissions ADD COLUMN public_brief_approved_at TEXT`,
        )
        .run();
    if (!names.has("public_brief_approved_by"))
      await db
        .prepare(
          `ALTER TABLE submissions ADD COLUMN public_brief_approved_by TEXT REFERENCES users(id)`,
        )
        .run();
    if (!names.has("contributor_needs"))
      await db
        .prepare(
          `ALTER TABLE submissions ADD COLUMN contributor_needs TEXT NOT NULL DEFAULT 'Not defined'`,
        )
        .run();
    if (!names.has("maintenance_status"))
      await db
        .prepare(
          `ALTER TABLE submissions ADD COLUMN maintenance_status TEXT NOT NULL DEFAULT 'Maintainer needed'`,
        )
        .run();
    if (!names.has("review_cadence"))
      await db
        .prepare(
          `ALTER TABLE submissions ADD COLUMN review_cadence TEXT NOT NULL DEFAULT 'Set during incubation'`,
        )
        .run();
    const toolColumns = await db
      .prepare(`PRAGMA table_info(tools)`)
      .all<{ name: string }>();
    const toolNames = new Set(toolColumns.results.map((column) => column.name));
    if (!toolNames.has("website"))
      await db.prepare(`ALTER TABLE tools ADD COLUMN website TEXT`).run();
    if (!toolNames.has("github"))
      await db.prepare(`ALTER TABLE tools ADD COLUMN github TEXT`).run();
    if (!toolNames.has("ownership"))
      await db
        .prepare(
          `ALTER TABLE tools ADD COLUMN ownership TEXT NOT NULL DEFAULT 'External project'`,
        )
        .run();
    if (!toolNames.has("maintainer"))
      await db
        .prepare(
          `ALTER TABLE tools ADD COLUMN maintainer TEXT NOT NULL DEFAULT 'Not identified'`,
        )
        .run();
    if (!toolNames.has("repository_status"))
      await db
        .prepare(
          `ALTER TABLE tools ADD COLUMN repository_status TEXT NOT NULL DEFAULT 'Not verified'`,
        )
        .run();
    if (!toolNames.has("license"))
      await db
        .prepare(
          `ALTER TABLE tools ADD COLUMN license TEXT NOT NULL DEFAULT 'Not identified'`,
        )
        .run();
    if (!toolNames.has("huhy_role"))
      await db
        .prepare(
          `ALTER TABLE tools ADD COLUMN huhy_role TEXT NOT NULL DEFAULT 'Discovery listing only'`,
        )
        .run();
  })();
  await ready;
  return db;
}
