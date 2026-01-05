// src/app/api/_lib/audit.ts
// Audit logging utilities

import { db } from '@/db';
import { auditLog } from '@/db/schema';

// Log an audit event
export async function logAuditEvent(
  userId: number,
  action: string,
  resourceType: string,
  tenantId: number,
  resourceId?: number | null,
  details?: any,
  ipAddress?: string | null,
  userAgent?: string | null
) {
  try {
    // Create audit log entry
    const [log] = await db
      .insert(auditLog)
      .values({
        userId,
        action,
        resourceType,
        tenantId,
        resourceId: resourceId || null,
        details: details ? JSON.stringify(details) : null,
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
export async function logUserLogin(userId: number, tenantId: number, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'login', 'user', tenantId, userId, { action: 'login' }, ipAddress, userAgent);
}

export async function logUserLogout(userId: number, tenantId: number, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'logout', 'user', tenantId, userId, { action: 'logout' }, ipAddress, userAgent);
}

export async function logTaskCreated(userId: number, tenantId: number, taskId: number, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'create', 'task', tenantId, taskId, details, ipAddress, userAgent);
}

export async function logTaskUpdated(userId: number, tenantId: number, taskId: number, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'update', 'task', tenantId, taskId, details, ipAddress, userAgent);
}

export async function logTaskDeleted(userId: number, tenantId: number, taskId: number, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'delete', 'task', tenantId, taskId, details, ipAddress, userAgent);
}

export async function logEventCreated(userId: number, tenantId: number, eventId: number, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'create', 'event', tenantId, eventId, details, ipAddress, userAgent);
}

export async function logEventUpdated(userId: number, tenantId: number, eventId: number, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'update', 'event', tenantId, eventId, details, ipAddress, userAgent);
}

export async function logFileUploaded(userId: number, tenantId: number, fileId: number, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'upload', 'file', tenantId, fileId, details, ipAddress, userAgent);
}

export async function logNotificationSent(userId: number, tenantId: number, notificationId: number, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'send', 'notification', tenantId, notificationId, details, ipAddress, userAgent);
}

export async function logAutomationRuleCreated(userId: number, tenantId: number, ruleId: number, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'create', 'automation_rule', tenantId, ruleId, details, ipAddress, userAgent);
}

export async function logAutomationRuleUpdated(userId: number, tenantId: number, ruleId: number, details?: any, ipAddress?: string | null, userAgent?: string | null) {
  return logAuditEvent(userId, 'update', 'automation_rule', tenantId, ruleId, details, ipAddress, userAgent);
}