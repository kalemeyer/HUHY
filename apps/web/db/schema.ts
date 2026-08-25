import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull().default("member"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      "users_role_check",
      sql`${table.role} IN ('member','triager','maintainer','steward')`,
    ),
    uniqueIndex("idx_users_single_steward")
      .on(table.role)
      .where(sql`${table.role} = 'steward'`),
  ],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    problem: text("problem").notNull(),
    people: text("people").notNull(),
    currentToday: text("current_today").notNull(),
    better: text("better").notNull(),
    frequency: text("frequency").notNull(),
    existingTool: text("existing_tool"),
    status: text("status").notNull().default("Pending review"),
    sourceStatus: text("source_status")
      .notNull()
      .default("Source research needed"),
    risk: text("risk").notNull().default("Unreviewed"),
    maintainer: text("maintainer").notNull().default("Unassigned"),
    contributorNeeds: text("contributor_needs")
      .notNull()
      .default("Not defined"),
    maintenanceStatus: text("maintenance_status")
      .notNull()
      .default("Maintainer needed"),
    reviewCadence: text("review_cadence")
      .notNull()
      .default("Set during incubation"),
    githubUrl: text("github_url"),
    githubIssueNumber: integer("github_issue_number"),
    githubUpdatedAt: text("github_updated_at"),
    githubCheckedAt: text("github_checked_at"),
    publicProblem: text("public_problem"),
    publicPeople: text("public_people"),
    publicCurrentToday: text("public_current_today"),
    publicBetter: text("public_better"),
    publicFrequency: text("public_frequency"),
    publicExistingTool: text("public_existing_tool"),
    publicBriefApprovedAt: text("public_brief_approved_at"),
    publicBriefApprovedBy: text("public_brief_approved_by").references(
      () => users.id,
    ),
    dispositionReason: text("disposition_reason"),
    reopeningCondition: text("reopening_condition"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_submissions_status_created").on(table.status, table.createdAt),
    index("idx_submissions_author_created").on(table.authorId, table.createdAt),
  ],
);

export const dispositionEvents = sqliteTable(
  "disposition_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    submissionId: text("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => users.id),
    reason: text("reason"),
    reopeningCondition: text("reopening_condition"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_disposition_submission_created").on(
      table.submissionId,
      table.createdAt,
    ),
  ],
);

export const tools = sqliteTable("tools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  platform: text("platform").notNull(),
  ownership: text("ownership").notNull(),
  maintainer: text("maintainer").notNull(),
  source: text("source").notNull(),
  repositoryStatus: text("repository_status").notNull(),
  license: text("license").notNull(),
  huhyRole: text("huhy_role").notNull(),
  lifecycle: text("lifecycle").notNull(),
  maintenance: text("maintenance").notNull(),
  website: text("website"),
  github: text("github"),
  note: text("note").notNull(),
  evidenceAsOf: text("evidence_as_of").notNull(),
});

export const toolRatings = sqliteTable(
  "tool_ratings",
  {
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.toolId, table.userId] }),
    check("tool_ratings_stars_check", sql`${table.stars} BETWEEN 1 AND 5`),
    index("idx_tool_ratings_tool").on(table.toolId),
  ],
);

export const toolRecommendations = sqliteTable(
  "tool_recommendations",
  {
    id: text("id").primaryKey(),
    submitterUserId: text("submitter_user_id").references(() => users.id),
    name: text("name").notNull(),
    website: text("website").notNull(),
    repository: text("repository"),
    category: text("category").notNull(),
    relationship: text("relationship").notNull(),
    useCase: text("use_case").notNull(),
    maintainer: text("maintainer"),
    license: text("license"),
    reviewNotes: text("review_notes"),
    status: text("status").notNull().default("Pending review"),
    reviewerUserId: text("reviewer_user_id").references(() => users.id),
    decisionNote: text("decision_note"),
    listedToolId: text("listed_tool_id").references(() => tools.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      "tool_recommendations_relationship_check",
      sql`${table.relationship} IN ('Community recommendation','I maintain this tool','I contribute to this tool')`,
    ),
    check(
      "tool_recommendations_status_check",
      sql`${table.status} IN ('Pending review','Duplicate','Referred to owner','Not listed','Listed')`,
    ),
    index("idx_tool_recommendations_status_created").on(
      table.status,
      table.createdAt,
    ),
    uniqueIndex("idx_tool_recommendations_pending_website")
      .on(table.website)
      .where(sql`${table.status} = 'Pending review'`),
  ],
);

export const writeRateLimits = sqliteTable(
  "write_rate_limits",
  {
    bucket: text("bucket").notNull(),
    action: text("action").notNull(),
    windowStart: integer("window_start").notNull(),
    count: integer("count").notNull().default(1),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.bucket, table.action, table.windowStart] }),
  ],
);

export const appMetadata = sqliteTable("app_metadata", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    detail: text("detail"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_audit_entity_created").on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
  ],
);
