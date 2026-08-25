CREATE TABLE `app_metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `submissions` ADD `github_checked_at` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `public_problem` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `public_people` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `public_current_today` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `public_better` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `public_frequency` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `public_existing_tool` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `public_brief_approved_at` text;--> statement-breakpoint
ALTER TABLE `submissions` ADD `public_brief_approved_by` text REFERENCES users(id);