export type Role = 'admin' | 'team' | 'guest';

export type Permission =
    | 'read:tasks'
    | 'create:tasks'
    | 'edit:tasks'
    | 'delete:tasks'
    | 'edit:task_status'
    | 'edit:task_priority'
    | 'read:events'
    | 'create:events'
    | 'edit:events'
    | 'delete:events'
    | 'read:users'
    | 'manage:users'
    | 'read:reports';

export const ROLES: Record<Role, Permission[]> = {
    admin: [
        'read:tasks', 'create:tasks', 'edit:tasks', 'delete:tasks',
        'edit:task_status', 'edit:task_priority',
        'read:events', 'create:events', 'edit:events', 'delete:events',
        'read:users', 'manage:users', 'read:reports'
    ],
    team: [
        'read:tasks', 'create:tasks', 'edit:task_status', 'edit:task_priority',
        'read:events', 'create:events', 'edit:events',
        'read:users'
    ],
    guest: [
        'read:tasks', 'create:tasks', // Guest can create (submit) tasks
        'read:events'
    ]
};

export function hasPermission(role: Role, permission: Permission): boolean {
    return ROLES[role]?.includes(permission) ?? false;
}

export function hasRole(user: { role: string }, roles: Role[]): boolean {
    return roles.includes(user.role as Role);
}

export function canEditTaskField(role: Role, field: string): boolean {
    if (role === 'admin') return true;
    if (role === 'team') return ['status', 'priority'].includes(field);
    return false;
}
