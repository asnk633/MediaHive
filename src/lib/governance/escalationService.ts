/**
 * Phase 11: Governance Engine - Escalation Service
 * 
 * Provides a clean interface for requesting exceptions:
 * requestException(policyId, context)
 * 
 * Must: preserve data, not mutate main state, be reversible
 */

import { EnforcementContext } from './policySchema';

export interface ExceptionRequest {
  id: string;
  policyId: string;
  userId: string;
  userName: string;
  userRole: string;
  context: EnforcementContext;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  requestedAt: number;
  reviewedAt?: number;
  reviewerId?: string;
  reviewerName?: string;
  approvedUntil?: number; // Expiration timestamp if temporary approval
  notes?: string;
}

export interface ExceptionQuery {
  policyId?: string;
  userId?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'revoked';
  fromDate?: number;
  toDate?: number;
  limit?: number;
  offset?: number;
}

export class EscalationService {
  private readonly STORE_KEY = 'governance_exceptions';
  private readonly MAX_REQUESTS = 1000; // Maximum number of exception requests to retain
  
  // In-memory cache for performance
  private requests: ExceptionRequest[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const stored = await this.loadFromStorage();
      this.requests = stored;
      this.isInitialized = true;
    } catch (error) {
      console.error('[EscalationService] Initialization failed:', error);
      // Continue with empty cache if storage fails
      this.isInitialized = true;
    }
  }

  /**
   * Request an exception to a policy
   * Preserves data, does not mutate main state, is reversible
   */
  async requestException(
    policyId: string,
    context: EnforcementContext,
    reason: string,
    userName: string,
    userRole: string
  ): Promise<string> {
    await this.ensureInitialized();

    const request: ExceptionRequest = {
      id: this.generateRequestId(),
      policyId,
      userId: context.userId,
      userName,
      userRole,
      context,
      reason,
      status: 'pending',
      requestedAt: Date.now()
    };

    this.requests.unshift(request); // Add to beginning
    
    // Maintain max store size
    if (this.requests.length > this.MAX_REQUESTS) {
      this.requests = this.requests.slice(0, this.MAX_REQUESTS);
    }

    await this.saveToStorage();
    
    return request.id;
  }

  /**
   * Approve an exception request
   */
  async approveException(
    requestId: string,
    reviewerId: string,
    reviewerName: string,
    approvedUntil?: number,
    notes?: string
  ): Promise<boolean> {
    await this.ensureInitialized();

    const request = this.requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'approved';
    request.reviewerId = reviewerId;
    request.reviewerName = reviewerName;
    request.reviewedAt = Date.now();
    request.approvedUntil = approvedUntil;
    request.notes = notes;

    await this.saveToStorage();
    return true;
  }

  /**
   * Reject an exception request
   */
  async rejectException(
    requestId: string,
    reviewerId: string,
    reviewerName: string,
    notes?: string
  ): Promise<boolean> {
    await this.ensureInitialized();

    const request = this.requests.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'rejected';
    request.reviewerId = reviewerId;
    request.reviewerName = reviewerName;
    request.reviewedAt = Date.now();
    request.notes = notes;

    await this.saveToStorage();
    return true;
  }

  /**
   * Revoke an approved exception
   */
  async revokeException(
    requestId: string,
    reviewerId: string,
    reviewerName: string,
    notes?: string
  ): Promise<boolean> {
    await this.ensureInitialized();

    const request = this.requests.find(r => r.id === requestId);
    if (!request || (request.status !== 'approved' && request.status !== 'pending')) {
      return false;
    }

    request.status = 'revoked';
    request.reviewerId = reviewerId;
    request.reviewerName = reviewerName;
    request.reviewedAt = Date.now();
    request.notes = notes;

    await this.saveToStorage();
    return true;
  }

  /**
   * Get an exception request by ID
   */
  async getRequest(requestId: string): Promise<ExceptionRequest | undefined> {
    await this.ensureInitialized();
    return this.requests.find(r => r.id === requestId);
  }

  /**
   * Query exception requests
   */
  async queryRequests(query: ExceptionQuery = {}): Promise<ExceptionRequest[]> {
    await this.ensureInitialized();

    let filtered = [...this.requests];

    // Apply filters
    if (query.policyId) {
      filtered = filtered.filter(request => request.policyId === query.policyId);
    }
    
    if (query.userId) {
      filtered = filtered.filter(request => request.userId === query.userId);
    }
    
    if (query.status) {
      filtered = filtered.filter(request => request.status === query.status);
    }
    
    if (query.fromDate) {
      filtered = filtered.filter(request => request.requestedAt >= query.fromDate!);
    }
    
    if (query.toDate) {
      filtered = filtered.filter(request => request.requestedAt <= query.toDate!);
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
   * Check if a user has an active exception for a specific policy
   */
  async hasActiveException(userId: string, policyId: string): Promise<boolean> {
    await this.ensureInitialized();

    const now = Date.now();
    const activeRequests = this.requests.filter(request => 
      request.userId === userId &&
      request.policyId === policyId &&
      request.status === 'approved' &&
      // Check if the exception hasn't expired
      (!request.approvedUntil || request.approvedUntil > now)
    );

    return activeRequests.length > 0;
  }

  /**
   * Get count of requests
   */
  async getCount(query: ExceptionQuery = {}): Promise<number> {
    const requests = await this.queryRequests(query);
    return requests.length;
  }

  /**
   * Clear exception requests (for testing purposes)
   */
  async clear(): Promise<void> {
    this.requests = [];
    try {
      localStorage.removeItem(this.STORE_KEY);
    } catch (error) {
      console.error('[EscalationService] Failed to clear storage:', error);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  private generateRequestId(): string {
    return `exception_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async loadFromStorage(): Promise<ExceptionRequest[]> {
    try {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      
      const stored = localStorage.getItem(this.STORE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('[EscalationService] Failed to load from storage:', error);
      return [];
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') {
        return;
      }

      const serialized = JSON.stringify(this.requests);
      localStorage.setItem(this.STORE_KEY, serialized);
    } catch (error) {
      console.error('[EscalationService] Failed to save to storage:', error);
    }
  }
}

// Create a singleton instance
export const escalationService = new EscalationService();
