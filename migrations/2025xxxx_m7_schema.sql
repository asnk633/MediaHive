-- migrations/2025xxxx_m7_schema.sql
-- Migration for M7 features: Knowledge Graph, Automation Builder, Multi-Tenant, Smart Notifications, AI Assistant, Unified Dashboard, Audit Trail, Performance Upgrades

-- Create tenants table for multi-tenant support
CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logo TEXT,
  domain TEXT NOT NULL UNIQUE,
  settings TEXT, -- JSON data for tenant-specific settings
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);

-- Add tenant_id to institutions table
ALTER TABLE institutions ADD COLUMN tenant_id INTEGER NOT NULL REFERENCES tenants(id) DEFAULT 1;

-- Add tenant_id to users table
ALTER TABLE users ADD COLUMN tenant_id INTEGER NOT NULL REFERENCES tenants(id) DEFAULT 1;

-- Add tenant_id to tasks table
ALTER TABLE tasks ADD COLUMN tenant_id INTEGER NOT NULL REFERENCES tenants(id) DEFAULT 1;

-- Add tenant_id to events table
ALTER TABLE events ADD COLUMN tenant_id INTEGER NOT NULL REFERENCES tenants(id) DEFAULT 1;

-- Add tenant_id to attendance table
ALTER TABLE attendance ADD COLUMN tenant_id INTEGER NOT NULL REFERENCES tenants(id) DEFAULT 1;

-- Add tenant_id to attachments table
ALTER TABLE attachments ADD COLUMN tenant_id INTEGER NOT NULL REFERENCES tenants(id) DEFAULT 1;

-- Add tenant_id to files table
ALTER TABLE files ADD COLUMN tenant_id INTEGER NOT NULL REFERENCES tenants(id) DEFAULT 1;

-- Create automation_rules table for no-code workflow builder
CREATE TABLE IF NOT EXISTS automation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'task_created', 'task_deadline', 'event_created', etc.
  trigger_config TEXT, -- JSON configuration for the trigger
  conditions TEXT, -- JSON array of conditions
  actions TEXT NOT NULL, -- JSON array of actions to perform
  enabled INTEGER NOT NULL DEFAULT 1, -- 1 for enabled, 0 for disabled
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Create indexes for automation_rules
CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant_id ON automation_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_type ON automation_rules(trigger_type);

-- Add columns to notifications table for smart notification system
ALTER TABLE notifications ADD COLUMN category TEXT; -- Notification categories for smart bundling
ALTER TABLE notifications ADD COLUMN ttl INTEGER; -- Time to live in seconds
ALTER TABLE notifications ADD COLUMN read_receipt INTEGER NOT NULL DEFAULT 0; -- Read receipt flag

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_ttl ON notifications(ttl);

-- Create knowledge_graph_cache table for knowledge graph layer
CREATE TABLE IF NOT EXISTS knowledge_graph_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  node_id TEXT NOT NULL UNIQUE,
  node_type TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON data for the node
  relationships TEXT, -- JSON array of relationships
  embedding TEXT, -- JSON array of embedding vector
  last_updated TEXT NOT NULL,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id)
);

-- Create indexes for knowledge_graph_cache
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_cache_node_id ON knowledge_graph_cache(node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_cache_node_type ON knowledge_graph_cache(node_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_cache_tenant_id ON knowledge_graph_cache(tenant_id);

-- Create audit_log table for compliance and observability
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
  resource_type TEXT NOT NULL, -- 'task', 'event', 'user', etc.
  resource_id INTEGER, -- ID of the resource being acted upon
  details TEXT, -- JSON data with additional details about the action
  ip_address TEXT, -- Masked IP address
  user_agent TEXT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  timestamp TEXT NOT NULL
);

-- Create indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);

-- Create ai_suggestions table for AI assistant
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  suggestion_type TEXT NOT NULL, -- 'task', 'event', 'team_allocation', etc.
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT, -- 'low', 'medium', 'high', 'urgent'
  suggested_assignee TEXT,
  confidence REAL, -- Confidence score between 0 and 1
  applied INTEGER NOT NULL DEFAULT 0, -- 1 if applied, 0 if not
  created_at TEXT NOT NULL,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id)
);

-- Create indexes for ai_suggestions
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_suggestion_type ON ai_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_applied ON ai_suggestions(applied);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_tenant_id ON ai_suggestions(tenant_id);

-- Create additional indexes for search performance
CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title);
CREATE INDEX IF NOT EXISTS idx_tasks_description ON tasks(description);
CREATE INDEX IF NOT EXISTS idx_events_title ON events(title);
CREATE INDEX IF NOT EXISTS idx_events_description ON events(description);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
CREATE INDEX IF NOT EXISTS idx_files_name ON files(name);

-- Insert default tenant
INSERT OR IGNORE INTO tenants (id, name, domain, created_at, updated_at) 
VALUES (1, 'Default Institution', 'default.local', datetime('now'), datetime('now'));