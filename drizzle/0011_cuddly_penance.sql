CREATE TABLE `admin_intervention_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`period` text NOT NULL,
	`risk_level_at_time` text NOT NULL,
	`note` text NOT NULL,
	`action_type` text NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`file_name` text NOT NULL,
	`file_url` text NOT NULL,
	`file_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`uploaded_by_id` integer NOT NULL,
	`tenant_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`resource_type` text NOT NULL,
	`resource_id` text,
	`details` text DEFAULT '{}',
	`ip_address` text,
	`user_agent` text,
	`tenant_id` integer NOT NULL,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `automation_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`trigger_type` text NOT NULL,
	`trigger_config` text,
	`conditions` text,
	`actions` text,
	`enabled` integer DEFAULT true NOT NULL,
	`tenant_id` integer NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `department_health_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`period` text NOT NULL,
	`total_tasks` integer DEFAULT 0,
	`completed_tasks` integer DEFAULT 0,
	`overdue_tasks` integer DEFAULT 0,
	`avg_completion_rate` real DEFAULT 0,
	`avg_on_time_rate` real DEFAULT 0,
	`avg_attendance_score` real DEFAULT 0,
	`department_health_score` real DEFAULT 0,
	`health_status` text NOT NULL,
	`tenant_id` integer NOT NULL,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`tenant_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `edit_locks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`acquired_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `media_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text,
	`uploader_id` integer,
	`type` text,
	`score` integer,
	`report_json` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `performance_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`period` text NOT NULL,
	`assigned_tasks` integer DEFAULT 0,
	`completed_tasks` integer DEFAULT 0,
	`on_time_completed_tasks` integer DEFAULT 0,
	`overdue_tasks` integer DEFAULT 0,
	`task_completion_rate` real DEFAULT 0,
	`on_time_rate` real DEFAULT 0,
	`overdue_load_ratio` real DEFAULT 0,
	`avg_delay_hours` real DEFAULT 0,
	`avg_daily_hours` real DEFAULT 0,
	`attendance_discipline_score` real DEFAULT 0,
	`individual_performance_score` real DEFAULT 0,
	`performance_status` text NOT NULL,
	`negative_discipline_days` integer DEFAULT 0,
	`tenant_id` integer NOT NULL,
	`generated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `presence` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`last_seen_at` text NOT NULL,
	`online` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`action` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `task_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`comment` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`logo` text,
	`domain` text NOT NULL,
	`settings` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_domain_unique` ON `tenants` (`domain`);--> statement-breakpoint
CREATE TABLE `user_departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`department_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_institutions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`institution_id` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`institution_id`) REFERENCES `institutions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vip_embeddings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`label` text NOT NULL,
	`user_id` integer,
	`embedding` text NOT NULL,
	`created_by` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `attendance` ADD `department_id` integer REFERENCES departments(id);--> statement-breakpoint
ALTER TABLE `attendance` ADD `tenant_id` integer NOT NULL REFERENCES tenants(id);--> statement-breakpoint
ALTER TABLE `attendance` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `attendance` ADD `status` text;--> statement-breakpoint
ALTER TABLE `attendance` ADD `worked_minutes` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `attendance` ADD `late_arrival` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `attendance` ADD `early_exit` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `attendance` ADD `pending_tasks_at_checkout` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `attendance` ADD `completed_tasks_today` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `attendance` ADD `approved_early_exit` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `attendance` ADD `negative_discipline_event` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `attendance` ADD `marked_by` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `events` ADD `approval_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `department_id` integer REFERENCES departments(id);--> statement-breakpoint
ALTER TABLE `events` ADD `tenant_id` integer NOT NULL REFERENCES tenants(id);--> statement-breakpoint
ALTER TABLE `events` ADD `updated_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `files` ADD `department_id` integer REFERENCES departments(id);--> statement-breakpoint
ALTER TABLE `files` ADD `tenant_id` integer NOT NULL REFERENCES tenants(id);--> statement-breakpoint
ALTER TABLE `institutions` ADD `tenant_id` integer NOT NULL REFERENCES tenants(id);--> statement-breakpoint
ALTER TABLE `notifications` ADD `body` text NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `read_at` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `channel` text DEFAULT 'ui';--> statement-breakpoint
ALTER TABLE `notifications` ADD `category` text;--> statement-breakpoint
ALTER TABLE `notifications` ADD `ttl` integer;--> statement-breakpoint
ALTER TABLE `notifications` ADD `read_receipt` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `notifications` ADD `updated_at` text;--> statement-breakpoint
ALTER TABLE `notifications` DROP COLUMN `message`;--> statement-breakpoint
ALTER TABLE `notifications` DROP COLUMN `metadata`;--> statement-breakpoint
ALTER TABLE `tasks` ADD `department_id` integer REFERENCES departments(id);--> statement-breakpoint
ALTER TABLE `tasks` ADD `tenant_id` integer NOT NULL REFERENCES tenants(id);--> statement-breakpoint
ALTER TABLE `tasks` ADD `reviewStatus` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `last_updated_by` integer REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `tasks` ADD `is_archived` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `tasks` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `department_id` integer REFERENCES departments(id);--> statement-breakpoint
ALTER TABLE `users` ADD `tenant_id` integer NOT NULL REFERENCES tenants(id);