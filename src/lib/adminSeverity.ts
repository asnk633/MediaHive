export type AdminSeverity = 'neutral' | 'low' | 'medium' | 'high';

export const getAdminSeverity = (count: number): AdminSeverity => {
    if (count === 0) return 'neutral';
    if (count <= 2) return 'low';
    if (count <= 5) return 'medium';
    return 'high';
};

export const getSeverityColor = (severity: AdminSeverity): string => {
    switch (severity) {
        case 'low': return 'bg-blue-500';
        case 'medium': return 'bg-amber-500';
        case 'high': return 'bg-red-500';
        default: return 'bg-slate-500';
    }
};

export const getSeverityGlow = (severity: AdminSeverity): string => {
    switch (severity) {
        case 'low': return 'rgba(59,130,246,0.3)';
        case 'medium': return 'rgba(245,158,11,0.3)';
        case 'high': return 'rgba(239,68,68,0.3)';
        default: return 'rgba(148,163,184,0.1)';
    }
};

export const getKPIBadge = (severities: AdminSeverity[]) => {
    if (severities.includes('high')) return { label: 'Escalation Required', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/10' };
    if (severities.includes('medium')) return { label: 'Attention Needed', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' };
    return { label: 'Systems Stable', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' };
};
