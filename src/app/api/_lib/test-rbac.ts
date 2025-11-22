// src/app/api/_lib/test-rbac.ts
// Simple test script to verify RBAC functions

import { hasRole, hasPermission } from './rbac';
import { AuthUser } from './auth';

// Mock user objects for testing
const mockAdminUser: AuthUser = {
  id: 1,
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'admin',
  institutionId: 1,
  tenantId: 1
};

const mockTeamUser: AuthUser = {
  id: 2,
  email: 'team@example.com',
  fullName: 'Team User',
  role: 'team',
  institutionId: 1,
  tenantId: 1
};

const mockGuestUser: AuthUser = {
  id: 3,
  email: 'guest@example.com',
  fullName: 'Guest User',
  role: 'guest',
  institutionId: 1,
  tenantId: 1
};

console.log('Testing RBAC functions...');

// Test hasRole function
console.log('Testing hasRole function:');
console.log('Admin has admin role:', hasRole(mockAdminUser, ['admin']));
console.log('Team has team role:', hasRole(mockTeamUser, ['team']));
console.log('Guest has guest role:', hasRole(mockGuestUser, ['guest']));
console.log('Admin has admin or team role:', hasRole(mockAdminUser, ['admin', 'team']));
console.log('Team has admin role (should be false):', hasRole(mockTeamUser, ['admin']));
console.log('Null user has admin role (should be false):', hasRole(null, ['admin']));

// Test hasPermission function
console.log('\nTesting hasPermission function:');
console.log('Admin has manage:users permission:', hasPermission(mockAdminUser, 'manage:users'));
console.log('Admin has send:notifications permission:', hasPermission(mockAdminUser, 'send:notifications'));
console.log('Admin has admin:monitoring permission:', hasPermission(mockAdminUser, 'admin:monitoring'));
console.log('Team has read:tasks permission:', hasPermission(mockTeamUser, 'read:tasks'));
console.log('Team has write:tasks permission:', hasPermission(mockTeamUser, 'write:tasks'));
console.log('Team has review:tasks permission:', hasPermission(mockTeamUser, 'review:tasks'));
console.log('Guest has read:tasks permission:', hasPermission(mockGuestUser, 'read:tasks'));
console.log('Guest has manage:users permission (should be false):', hasPermission(mockGuestUser, 'manage:users'));
console.log('Team has manage:users permission (should be false):', hasPermission(mockTeamUser, 'manage:users'));
console.log('Guest has send:notifications permission (should be false):', hasPermission(mockGuestUser, 'send:notifications'));
console.log('Null user has read:tasks permission (should be false):', hasPermission(null, 'read:tasks'));

console.log('\nRBAC tests completed successfully!');