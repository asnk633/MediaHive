CREATE TABLE IF NOT EXISTS `media_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text,
	`uploader_id` integer REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	`type` text,
	`score` integer,
	`report_json` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint