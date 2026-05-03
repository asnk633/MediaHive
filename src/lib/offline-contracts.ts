/**
 * Offline Contracts - Defines which actions are allowed offline vs. forbidden
 * This enforces the explicit offline contract across the application
 */

export type OfflineAction =
  | 'create_task'
  | 'update_task'
  | 'delete_task'
  | 'assign_task'
  | 'update_profile'
  | 'upload_attachment'
  | 'create_event'
  | 'update_event'
  | 'delete_event'
  | 'send_notification'
  | 'update_settings'
  | 'create_campaign'
  | 'update_campaign';

export interface OfflineContract {
  action: OfflineAction;
  allowedOffline: boolean;
  reason?: string;
  requiresAuth?: boolean;
}

// Define which actions are allowed offline
const OFFLINE_CONTRACTS: Record<OfflineAction, OfflineContract> = {
  create_task: {
    action: 'create_task',
    allowedOffline: true,
    requiresAuth: true
  },
  update_task: {
    action: 'update_task',
    allowedOffline: true,
    requiresAuth: true
  },
  delete_task: {
    action: 'delete_task',
    allowedOffline: true,
    requiresAuth: true
  },
  assign_task: {
    action: 'assign_task',
    allowedOffline: true,
    requiresAuth: true
  },
  update_profile: {
    action: 'update_profile',
    allowedOffline: false,
    reason: 'Profile updates require immediate server validation and may affect permissions',
    requiresAuth: true
  },
  upload_attachment: {
    action: 'upload_attachment',
    allowedOffline: false,
    reason: 'File uploads require stable connection and cannot be queued reliably',
    requiresAuth: true
  },
  create_event: {
    action: 'create_event',
    allowedOffline: true,
    requiresAuth: true
  },
  update_event: {
    action: 'update_event',
    allowedOffline: true,
    requiresAuth: true
  },
  delete_event: {
    action: 'delete_event',
    allowedOffline: true,
    requiresAuth: true
  },
  send_notification: {
    action: 'send_notification',
    allowedOffline: false,
    reason: 'Notifications require immediate delivery and server-side processing',
    requiresAuth: true
  },
  update_settings: {
    action: 'update_settings',
    allowedOffline: false,
    reason: 'Settings changes affect all users and require immediate server validation',
    requiresAuth: true
  },
  create_campaign: {
    action: 'create_campaign',
    allowedOffline: false,
    reason: 'Campaigns involve complex server-side workflows that cannot be queued',
    requiresAuth: true
  },
  update_campaign: {
    action: 'update_campaign',
    allowedOffline: false,
    reason: 'Campaigns involve complex server-side workflows that cannot be queued',
    requiresAuth: true
  }
};

/**
 * Check if an action is allowed offline
 */
export function isActionAllowedOffline(action: OfflineAction): boolean {
  return OFFLINE_CONTRACTS[action]?.allowedOffline ?? false;
}

/**
 * Get the contract details for an action
 */
export function getOfflineContract(action: OfflineAction): OfflineContract {
  return OFFLINE_CONTRACTS[action] || {
    action,
    allowedOffline: false,
    reason: 'Action not defined in offline contracts',
    requiresAuth: true
  };
}

/**
 * Check if user can perform an action given current connectivity state
 */
export function canPerformAction(action: OfflineAction, isOnline: boolean): {
  allowed: boolean;
  reason?: string;
  requiresOnline: boolean;
} {
  const contract = getOfflineContract(action);
  
  if (!contract.allowedOffline && !isOnline) {
    return {
      allowed: false,
      reason: contract.reason || `Action "${action}" requires online connection`,
      requiresOnline: true
    };
  }
  
  return {
    allowed: true,
    requiresOnline: !contract.allowedOffline
  };
}
