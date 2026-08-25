CREATE TABLE `tool_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`submitter_user_id` text,
	`name` text NOT NULL,
	`website` text NOT NULL,
	`repository` text,
	`category` text NOT NULL,
	`relationship` text NOT NULL,
	`use_case` text NOT NULL,
	`maintainer` text,
	`license` text,
	`review_notes` text,
	`status` text DEFAULT 'Pending review' NOT NULL,
	`reviewer_user_id` text,
	`decision_note` text,
	`listed_tool_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`submitter_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`listed_tool_id`) REFERENCES `tools`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "tool_recommendations_relationship_check" CHECK("tool_recommendations"."relationship" IN ('Community recommendation','I maintain this tool','I contribute to this tool')),
	CONSTRAINT "tool_recommendations_status_check" CHECK("tool_recommendations"."status" IN ('Pending review','Duplicate','Referred to owner','Not listed','Listed'))
);
--> statement-breakpoint
CREATE INDEX `idx_tool_recommendations_status_created` ON `tool_recommendations` (`status`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_tool_recommendations_pending_website` ON `tool_recommendations` (`website`) WHERE "tool_recommendations"."status" = 'Pending review';