CREATE TABLE IF NOT EXISTS `departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tenant_id` integer NOT NULL REFERENCES tenants(id),
	`created_at` text NOT NULL
);
--> statement-breakpoint

-- Add department_id column to users table
ALTER TABLE `users` ADD COLUMN `department_id` integer REFERENCES departments(id);
--> statement-breakpoint

-- Add department_id column to tasks table
ALTER TABLE `tasks` ADD COLUMN `department_id` integer REFERENCES departments(id);
--> statement-breakpoint

-- Add department_id column to events table
ALTER TABLE `events` ADD COLUMN `department_id` integer REFERENCES departments(id);
--> statement-breakpoint

-- Add department_id column to attendance table
ALTER TABLE `attendance` ADD COLUMN `department_id` integer REFERENCES departments(id);
--> statement-breakpoint

-- Add department_id column to files table
ALTER TABLE `files` ADD COLUMN `department_id` integer REFERENCES departments(id);