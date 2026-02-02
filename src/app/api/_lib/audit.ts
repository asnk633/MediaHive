// src/app/api/_lib/audit.ts
// Audit logging utilities

import { getDb } from '@/db';
import { auditLog } from '@/db/schema';

// Log an audit event
export async function logAuditEvent(
  userId: string,
  action: string,
  resourceType: string,
  tenantId: number | string,
  resourceId?: string | null,
  details?: any,
  ipAddress?: string | null,
  userAgent?: string | null
) {
  try {
    // Robustly handle tenantId
    let safeTenantId: number | null = null;

    if (typeof tenantId === 'number') {
      safeTenantId = tenantId;
    } else if (typeof tenantId === 'string') {
      const parsed = parseInt(tenantId, 10);
      if (!isNaN(parsed)) safeTenantId = parsed;
    }

    if (safeTenantId === null) {
      console.warn(`Audit Log Skipped: Invalid tenantId (${tenantId}) for action ${action}`);
      return null;
    }

    const db = await getDb();
    // Create audit log entry
    const [log] = await db
      .insert(auditLog)
      .values({
        userId,
        action,
        resourceType,
        tenantId: safeTenantId,
        resourceId: resourceId || null,
        details: details ? JSON.stringify(details) : '{}',
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        timestamp: new Date().toISOString(),
      })
      .returning();

    return log;
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw error as audit logging shouldn't break the main flow
    return null;
  }
}

// Convenience functions for common audit events
export async function logUserLogin(userId: string, tenantId: number | string, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'login', 'user', tenantId, null, { action: 'login' }, ipAddress, userAgent);
}

export async function logUserLogout(userId: string, tenantId: number | string, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'logout', 'user', tenantId, null, { action: 'logout' }, ipAddress, userAgent);
}

export async function logTaskCreated(userId: string, tenantId: number | string, taskId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'create', 'task', tenantId, taskId, details, ipAddress, userAgent);
}

export async function logTaskUpdated(userId: string, tenantId: number | string, taskId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'update', 'task', tenantId, taskId, details, ipAddress, userAgent);
}

export async function logTaskDeleted(userId: string, tenantId: number | string, taskId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'delete', 'task', tenantId, taskId, details, ipAddress, userAgent);
}

export async function logEventCreated(userId: string, tenantId: number | string, eventId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'create', 'event', tenantId, eventId, details, ipAddress, userAgent);
}

export async function logEventUpdated(userId: string, tenantId: number | string, eventId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'update', 'event', tenantId, eventId, details, ipAddress, userAgent);
}

export async function logEventDeleted(userId: string, tenantId: number | string, eventId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'delete', 'event', tenantId, eventId, details, ipAddress, userAgent);
}

export async function logFileUploaded(userId: string, tenantId: number | string, fileId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'upload', 'file', tenantId, fileId, details, ipAddress, userAgent);
}

export async function logNotificationSent(userId: string, tenantId: number | string, notificationId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'send', 'notification', tenantId, notificationId, details, ipAddress, userAgent);
}

export async function logAutomationRuleCreated(userId: string, tenantId: number | string, ruleId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'create', 'automation_rule', tenantId, ruleId, details, ipAddress, userAgent);
}

export async function logAutomationRuleUpdated(userId: string, tenantId: number | string, ruleId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'update', 'automation_rule', tenantId, ruleId, details, ipAddress, userAgent);
}

export async function logStaleTaskNotification(userId: string, tenantId: number | string, taskId: string, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'notify', 'stale_task', tenantId, taskId, details, ipAddress, userAgent);
}

export async function logSystemActivity(userId: string, tenantId: number | string, details: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'system_activity', 'system', tenantId, null, details, ipAddress, userAgent);
}