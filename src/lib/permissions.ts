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
    | 'read:reports'
    | 'write:intervention'
    | 'read:audit_log';

export const ROLES: Record<Role, Permission[]> = {
    admin: [
        'read:tasks', 'create:tasks', 'edit:tasks', 'delete:tasks',
        'edit:task_status', 'edit:task_priority',
        'read:events', 'create:events', 'edit:events', 'delete:events',
        'read:users', 'manage:users', 'read:reports',
        'write:intervention', 'read:audit_log'
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

// --- Granular Permissions Logic ---

// Helper to reliably extract ID from user object or string or number
function getUserId(user: any): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    if (typeof user === 'number') return String(user);
    if (user.uid) return String(user.uid);
    if (user.id) return String(user.id);
    return '';
}

export function canEditTask(user: any, task: any): boolean {
    if (!user || !task) return false;
    const role = user.role?.toLowerCase() || 'guest';
    const userId = getUserId(user);

    // Admin -> always
    if (role === 'admin' || user.isAdmin) return true;

    // Team -> only if assigned to them
    if (role === 'team' || user.isTeam) {
        if (!task.assignedTo) return false;
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
        return assignees.some((a: any) => getUserId(a) === userId);
    }

    // Guest -> only if they created it
    // Note: guest-created tasks usually map 'createdBy' to them
    const creatorId = getUserId(task.createdBy);
    return creatorId === userId;
}

export function canChangeStatus(user: any, task: any): boolean {
    if (!user || !task) return false;
    const role = user.role?.toLowerCase() || 'guest';
    const userId = getUserId(user);

    // Admin -> yes
    if (role === 'admin' || user.isAdmin) return true;

    // Team -> yes (if assigned)
    if (role === 'team' || user.isTeam) {
        if (!task.assignedTo) return false;
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
        return assignees.some((a: any) => getUserId(a) === userId);
    }

    // Guest -> never
    return false;
}

export function canEditPriority(user: any, task: any): boolean {
    if (!user || !task) return false;
    const role = user.role?.toLowerCase() || 'guest';
    const userId = getUserId(user);

    // Admin -> yes
    if (role === 'admin' || user.isAdmin) return true;

    // Team -> yes (if assigned)
    if (role === 'team' || user.isTeam) {
        if (!task.assignedTo) return false;
        const assignees = Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo];
        return assignees.some((a: any) => getUserId(a) === userId);
    }

    // Guest -> never
    return false;
}

export function canAssignTask(user: any, targetUserId?: string): boolean {
    if (!user) return false;
    const role = user.role?.toLowerCase() || 'guest';
    const currentUserId = getUserId(user);

    // Admin -> always
    if (role === 'admin' || user.isAdmin) return true;

    // Team -> only to self
    if (role === 'team' || user.isTeam) {
        // If targetUserId is provided, it must match currentUserId
        if (targetUserId) return targetUserId === currentUserId;
        // If simply asking "can I assign tasks?", the answer is "yes (but only to self)"
        // But for UI checks without target, usually we want to know if they have assignment capabilities
        return true;
    }

    // Guest -> never
    return false;
}

export function hasPermission(role: Role | string, permission: Permission): boolean {
    if (!role) return false;
    const r = (role.toLowerCase()) as Role;
    const permissions = ROLES[r] || ROLES.guest;
    return permissions.includes(permission);
}

export function canManageAllTasks(user: any): boolean {
    if (!user) return false;

    const role = user.role?.toLowerCase();

    // Admins have full task control
    if (role === 'admin' || user.isAdmin) return true;

    // No other role can manage all tasks
    return false;
}

export function hasRole(user: any, role: Role | Role[]): boolean {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
}
