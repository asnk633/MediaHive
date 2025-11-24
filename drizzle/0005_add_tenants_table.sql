CREATE TABLE IF NOT EXISTS `tenants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo` text,
	`domain` text NOT NULL,
	`settings` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `tenants_domain_unique` ON `tenants` (`domain`);
--> statement-breakpoint
-- Check if column exists before adding it to institutions
-- ALTER TABLE `institutions` ADD COLUMN `tenant_id` integer NOT NULL REFERENCES tenants(id) DEFAULT 1;
--> statement-breakpoint
-- ALTER TABLE `users` ADD COLUMN `tenant_id` integer NOT NULL REFERENCES tenants(id) DEFAULT 1;
--> statement-breakpoint
-- ALTER TABLE `tasks` ADD COLUMN `tenant_id` integer NOT NULL REFERENCES tenants(id) DEFAULT 1;
--> statement-breakpoint
-- ALTER TABLE `events` ADD COLUMN `tenant_id` integer NOT NULL REFERENCES tenants(id) DEFAULT 1;
--> statement-breakpoint
-- ALTER TABLE `attendance` ADD COLUMN `tenant_id` integer NOT NULL REFERENCES tenants(id) DEFAULT 1;
--> statement-breakpoint
-- ALTER TABLE `files` ADD COLUMN `tenant_id` integer NOT NULL REFERENCES tenants(id) DEFAULT 1;