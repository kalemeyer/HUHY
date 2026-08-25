ALTER TABLE `tools` ADD `ownership` text DEFAULT 'External project' NOT NULL;--> statement-breakpoint
ALTER TABLE `tools` ADD `maintainer` text DEFAULT 'Not identified' NOT NULL;--> statement-breakpoint
ALTER TABLE `tools` ADD `repository_status` text DEFAULT 'Not verified' NOT NULL;--> statement-breakpoint
ALTER TABLE `tools` ADD `license` text DEFAULT 'Not identified' NOT NULL;--> statement-breakpoint
ALTER TABLE `tools` ADD `huhy_role` text DEFAULT 'Discovery listing only' NOT NULL;
