import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { 
    ROLES, 
    Permission, 
    canEditTask as canEditTaskHelper,
    canChangeStatus as canChangeStatusHelper,
    canEditPriority as canEditPriorityHelper,
    canAssignTask as canAssignTaskHelper,
    canManageAllTasks as canManageAllTasksHelper
} from '@/lib/permissions';

export function usePermissions() {
    const { user } = useAuth();
    const { currentRole, currentWorkspaceId } = useWorkspace();

    const permissions = useMemo(() => {
        if (!user) return {
            canCreateTask: false,
            canEditTask: (task: any) => false,
            canDeleteTask: false,
            canChangeStatus: (task: any) => false,
            canEditPriority: (task: any) => false,
            canAssignTask: false,
            canManageUsers: false,
            canDeleteEvent: false,
            canUploadFiles: false,
            canReadReports: false,
            role: 'guest'
        };

        const hasPerm = (p: Permission) => {
            const perms = ROLES[currentRole] || ROLES.guest;
            return perms.includes(p);
        };

        return {
            // Static flags
            canCreateTask: hasPerm('create:tasks'),
            canDeleteTask: hasPerm('delete:tasks'),
            canAssignTask: hasPerm('assign:tasks'),
            canManageUsers: hasPerm('manage:users'),
            canDeleteEvent: hasPerm('delete:events'),
            canUploadFiles: hasPerm('upload:files'),
            canReadReports: hasPerm('read:reports'),
            canManageAllTasks: canManageAllTasksHelper(user, currentRole as any),
            
            // Dynamic helpers (context-aware)
            canEditTask: (task: any) => canEditTaskHelper(user, task, currentRole as any),
            canChangeStatus: (task: any) => canChangeStatusHelper(user, task, currentRole as any),
            canEditPriority: (task: any) => canEditPriorityHelper(user, task, currentRole as any),
            
            // Context
            role: currentRole,
            workspaceId: currentWorkspaceId
        };
    }, [user, currentRole, currentWorkspaceId]);

    return permissions;
}
