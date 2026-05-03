export const AuditService = {
    logAction: async (action: any, context?: any): Promise<void> => {
        console.warn("AuditService.logAction is stubbed out", action, context);
    }
};
