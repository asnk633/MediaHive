"use client";

import { useRole } from "@/app/(shell)/RoleContext";
import { Permission, hasPermission, Role } from "@/lib/permissions";

export function usePermission() {
    const { user } = useRole();

    const can = (permission: Permission) => {
        if (!user) return false;
        return hasPermission(user.role as Role, permission);
    };

    const is = (role: Role) => user?.role === role;

    return { can, is, role: user?.role as Role };
}
