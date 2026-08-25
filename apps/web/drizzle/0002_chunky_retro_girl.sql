ALTER TABLE `submissions` ADD `contributor_needs` text DEFAULT 'Not defined' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `maintenance_status` text DEFAULT 'Maintainer needed' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `review_cadence` text DEFAULT 'Set during incubation' NOT NULL;--> statement-breakpoint
ALTER TABLE `tools` ADD `website` text;--> statement-breakpoint
ALTER TABLE `tools` ADD `github` text;