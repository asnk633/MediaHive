// __mocks__/authContextMock.ts
import React from 'react';

// Mock AuthContext with default values
export const AuthContext = React.createContext({
  user: null,
  role: { role: 'guest', tags: [] },
  loading: false,
  verified: false,
  setUser: () => {},
  setRole: () => {},
  notifications: [],
  tasks: []
});

export const useAuth = () => ({
  user: null,
  role: { role: 'guest', tags: [] },
  loading: false,
  verified: false
});