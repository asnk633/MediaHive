import React from 'react';
export const AuthContext = React.createContext({
    user: { uid: 'test-user', email: 'test@example.com' },
    role: { role: 'guest', tags: [] },
    loading: false,
    verified: true,
});
