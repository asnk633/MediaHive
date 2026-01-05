import React from 'react';
export const useRole = () => ({
    user: { id: 'test-user', name: 'Test User', role: 'guest' },
    role: 'guest',
    loading: false,
});
export const RoleProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
