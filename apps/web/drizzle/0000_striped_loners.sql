CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_entity_created` ON `audit_log` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `disposition_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`submission_id` text NOT NULL,
	`from_status` text,
	`to_status` text NOT NULL,
	`actor_user_id` text NOT NULL,
	`reason` text,
	`reopening_condition` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_disposition_submission_created` ON `disposition_events` (`submission_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`problem` text NOT NULL,
	`people` text NOT NULL,
	`current_today` text NOT NULL,
	`better` text NOT NULL,
	`frequency` text NOT NULL,
	`existing_tool` text,
	`status` text DEFAULT 'Pending review' NOT NULL,
	`source_status` text DEFAULT 'Source research needed' NOT NULL,
	`risk` text DEFAULT 'Unreviewed' NOT NULL,
	`maintainer` text DEFAULT 'Unassigned' NOT NULL,
	`github_url` text,
	`disposition_reason` text,
	`reopening_condition` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_submissions_status_created` ON `submissions` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_submissions_author_created` ON `submissions` (`author_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `tool_ratings` (
	`tool_id` text NOT NULL,
	`user_id` text NOT NULL,
	`stars` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`tool_id`, `user_id`),
	FOREIGN KEY (`tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "tool_ratings_stars_check" CHECK("tool_ratings"."stars" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE INDEX `idx_tool_ratings_tool` ON `tool_ratings` (`tool_id`);--> statement-breakpoint
CREATE TABLE `tools` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`platform` text NOT NULL,
	`source` text NOT NULL,
	`lifecycle` text NOT NULL,
	`maintenance` text NOT NULL,
	`note` text NOT NULL,
	`evidence_as_of` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "users_role_check" CHECK("users"."role" IN ('member','triager','maintainer','steward'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_single_steward` ON `users` (`role`) WHERE "users"."role" = 'steward';