# MediaHive Database Schema Documentation

This document describes the PostgreSQL schema used in MediaHive (Supabase).

## 🗃️ Core Tables

### 1. `tasks`
Main table for task management.
- `id`: `SERIAL PRIMARY KEY`
- `title`: `TEXT NOT NULL`
- `description`: `TEXT`
- `status`: `TEXT` (e.g., 'pending', 'todo', 'in_progress', 'completed')
- `priority`: `TEXT` ('low', 'medium', 'high')
- `due_date`: `TIMESTAMP WITH TIME ZONE`
- `assigned_to`: `JSONB` (Array of objects: `{ uid: string, name: string }`)
- `type`: `TEXT`
- `institution_id`: `INTEGER`
- `department_id`: `INTEGER`
- `tenant_id`: `INTEGER` (Secondary tenant identifier)
- `created_by`: `JSONB` (Object: `{ uid: string, name: string, role: string }`)
- `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT NOW()`
- `updated_at`: `TIMESTAMP WITH TIME ZONE DEFAULT NOW()`

### 2. `events`
Table for event tracking and media coverage requests.
- `id`: `SERIAL PRIMARY KEY`
- `title`: `TEXT NOT NULL`
- `description`: `TEXT`
- `start_at`: `TIMESTAMP WITH TIME ZONE`
- `end_at`: `TIMESTAMP WITH TIME ZONE`
- `approval_status`: `TEXT` ('pending', 'approved', 'rejected')
- `status`: `TEXT` ('upcoming', 'live', 'past')
- `media_coverage`: `JSONB` (Array of items)
- `institution_id`: `INTEGER`
- `department_id`: `INTEGER`
- `tenant_id`: `INTEGER`
- `created_by`: `JSONB`
- `created_at`: `TIMESTAMP WITH TIME ZONE`

### 3. `campaigns`
Long-term marketing or operational campaigns.
- `id`: `SERIAL PRIMARY KEY`
- `name`: `TEXT NOT NULL`
- `description`: `TEXT`
- `owner_id`: `TEXT` (Profile reference)
- `phase`: `TEXT` ('planning', 'active', 'finished')
- `start_date`: `TIMESTAMP WITH TIME ZONE`
- `end_date`: `TIMESTAMP WITH TIME ZONE`
- `members`: `JSONB` (List of user IDs)
- `institution_id`: `INTEGER`

### 4. `audit_log`
System-wide action logging for security and compliance.
- `id`: `SERIAL PRIMARY KEY`
- `user_id`: `TEXT`
- `action`: `TEXT`
- `resource_type`: `TEXT`
- `resource_id`: `TEXT`
- `details`: `JSONB`
- `timestamp`: `TIMESTAMP WITH TIME ZONE`

---

## 🔗 Relationships
- **Multi-Tenancy**: Most tables use `institution_id` or `tenant_id` to partition data.
- **Profiles**: Users are stored in the `profiles` table, referenced by `uid` or `owner_id` in other tables.

## 🛠️ Migration System
Migrations are located in `src/db/migrations/`. 
Always add new columns via timestamped SQL files and update this documentation.
Check schema alignment on dev startup with `npm run dev`.
