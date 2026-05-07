export function getRoleBadgeColors(role?: string | null): string {
    switch (role?.toLowerCase()) {
        case 'admin':
            return "bg-red-500/20 text-red-400 border border-red-500/30";
        case 'manager':
            return "bg-amber-500/20 text-amber-400 border border-amber-500/30";
        case 'team':
            return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
        case 'member':
            return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
        default:
            return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
    }
}
