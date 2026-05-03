/**
 * Phase 11: Governance Engine - Audit Trail
 * 
 * Every enforcement must log: Policy ID + version, Who was affected, 
 * What action was restricted, Timestamp. No exceptions.
 */

import { EnforcementResult } from './policySchema';

export interface AuditEntry {
  id: string;
  policyId: string;
  policyVersion: string;
  userId: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  field?: string;
  enforcementType: string; // Using string to capture EnforcementType values
  reason: string;
  timestamp: number;
  details?: Record<string, any>;
}

export interface AuditQuery {
  policyId?: string;
  userId?: string;
  action?: string;
  resourceType?: string;
  enforcementType?: string;
  fromDate?: number;
  toDate?: number;
  limit?: number;
  offset?: number;
}

export class AuditTrail {
  private readonly STORE_KEY = 'governance_audit_trail';
  private readonly MAX_ENTRIES = 10000; // Maximum number of audit entries to retain
  
  // In-memory cache for performance
  private entries: AuditEntry[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const stored = await this.loadFromStorage();
      this.entries = stored;
      this.isInitialized = true;
    } catch (error) {
      console.error('[AuditTrail] Initialization failed:', error);
      // Continue with empty cache if storage fails
      this.isInitialized = true;
    }
  }

  /**
   * Log an enforcement action to the audit trail
   */
  async logEnforcement(
    result: EnforcementResult,
    userId: string,
    userRole: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    field?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.ensureInitialized();

    const auditEntry: AuditEntry = {
      id: this.generateAuditId(),
      policyId: result.policyId,
      policyVersion: result.policyVersion,
      userId,
      userRole,
      action,
      resourceType,
      resourceId,
      field,
      enforcementType: result.enforcementType,
      reason: result.reason,
      timestamp: Date.now(),
      details: {
        ...details,
        enforcementDetails: result.details
      }
    };

    this.entries.unshift(auditEntry); // Add to beginning
    
    // Maintain max store size
    if (this.entries.length > this.MAX_ENTRIES) {
      this.entries = this.entries.slice(0, this.MAX_ENTRIES);
    }

    await this.saveToStorage();
  }

  /**
   * Query audit entries
   */
  async queryEntries(query: AuditQuery = {}): Promise<AuditEntry[]> {
    await this.ensureInitialized();

    let filtered = [...this.entries];

    // Apply filters
    if (query.policyId) {
      filtered = filtered.filter(entry => entry.policyId === query.policyId);
    }
    
    if (query.userId) {
      filtered = filtered.filter(entry => entry.userId === query.userId);
    }
    
    if (query.action) {
      filtered = filtered.filter(entry => entry.action === query.action);
    }
    
    if (query.resourceType) {
      filtered = filtered.filter(entry => entry.resourceType === query.resourceType);
    }
    
    if (query.enforcementType) {
      filtered = filtered.filter(entry => entry.enforcementType === query.enforcementType);
    }
    
    if (query.fromDate) {
      filtered = filtered.filter(entry => entry.timestamp >= query.fromDate!);
    }
    
    if (query.toDate) {
      filtered = filtered.filter(entry => entry.timestamp <= query.toDate!);
    }

    // Apply pagination
    if (query.offset) {
      filtered = filtered.slice(query.offset);
    }
    
    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * Get count of audit entries
   */
  async getCount(query: AuditQuery = {}): Promise<number> {
    const entries = await this.queryEntries(query);
    return entries.length;
  }

  /**
   * Clear audit trail (for testing purposes)
   */
  async clear(): Promise<void> {
    this.entries = [];
    try {
      localStorage.removeItem(this.STORE_KEY);
    } catch (error) {
      console.error('[AuditTrail] Failed to clear storage:', error);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadFromStorage(): Promise<AuditEntry[]> {
    try {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      
      const stored = localStorage.getItem(this.STORE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('[AuditTrail] Failed to load from storage:', error);
      return [];
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const serialized = JSON.stringify(this.entries);
      localStorage.setItem(this.STORE_KEY, serialized);
    } catch (error) {
      console.error('[AuditTrail] Failed to save to storage:', error);
    }
  }
}

// Create a singleton instance
export const auditTrail = new AuditTrail();
