CREATE TABLE IF NOT EXISTS `user_departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	`department_id` integer NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
	`created_at` text NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `user_institutions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	`institution_id` integer NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
	`created_at` text NOT NULL
);