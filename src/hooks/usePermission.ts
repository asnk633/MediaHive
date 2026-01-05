"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Permission, hasPermission, Role } from "@/lib/permissions";

export function usePermission() {
    const { user } = useAuth();

    const can = (permission: Permission) => {
        if (!user) return false;
        return hasPermission(user.role as Role, permission);
    };

    const is = (role: Role) => user?.role === role;

    return { can, is, role: user?.role as Role };
}
