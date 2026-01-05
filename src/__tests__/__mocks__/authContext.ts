import { createContext, useContext } from 'react';

export const AuthContext = createContext<any>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    return context || { user: null, loading: false, logout: jest.fn() };
};
