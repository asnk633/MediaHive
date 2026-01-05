-- Remove department_id column from files table
ALTER TABLE `files` DROP COLUMN `department_id`;
--> statement-breakpoint

-- Remove department_id column from attendance table
ALTER TABLE `attendance` DROP COLUMN `department_id`;
--> statement-breakpoint

-- Remove department_id column from events table
ALTER TABLE `events` DROP COLUMN `department_id`;
--> statement-breakpoint

-- Remove department_id column from tasks table
ALTER TABLE `tasks` DROP COLUMN `department_id`;
--> statement-breakpoint

-- Remove department_id column from users table
ALTER TABLE `users` DROP COLUMN `department_id`;
--> statement-breakpoint

-- Drop departments table
DROP TABLE IF EXISTS `departments`;