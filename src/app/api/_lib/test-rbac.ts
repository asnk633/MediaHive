// src/app/api/_lib/test-rbac.ts
// Simple test script to verify RBAC functions

import { hasPermission } from '@/lib/permissions';
import { hasRole, AuthUser } from './auth';

// Mock user objects for testing
const mockAdminUser: AuthUser = {
  id: 1,
  email: 'admin@example.com',
  fullName: 'Admin User',
  role: 'admin',
  institution_id: 1,
  tenantId: 1
};

const mockTeamUser: AuthUser = {
  id: 2,
  email: 'team@example.com',
  fullName: 'Team User',
  role: 'team',
  institution_id: 1,
  tenantId: 1
};

const mockGuestUser: AuthUser = {
  id: 3,
  email: 'guest@example.com',
  fullName: 'Guest User',
  role: 'guest',
  institution_id: 1,
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
console.log('Admin has manage:users permission:', hasPermission(mockAdminUser.role, 'manage:users'));
console.log('Admin has read:reports permission:', hasPermission(mockAdminUser.role, 'read:reports'));
console.log('Team has read:tasks permission:', hasPermission(mockTeamUser.role, 'read:tasks'));
console.log('Team has create:tasks permission:', hasPermission(mockTeamUser.role, 'create:tasks'));
console.log('Team has edit:task_status permission:', hasPermission(mockTeamUser.role, 'edit:task_status'));
console.log('Guest has read:tasks permission:', hasPermission(mockGuestUser.role, 'read:tasks'));
console.log('Guest has manage:users permission (should be false):', hasPermission(mockGuestUser.role, 'manage:users'));
console.log('Team has manage:users permission (should be false):', hasPermission(mockTeamUser.role, 'manage:users'));

console.log('\nRBAC tests completed successfully!');
