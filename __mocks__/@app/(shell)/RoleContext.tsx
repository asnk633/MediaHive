// __mocks__/@app/(shell)/RoleContext.tsx
import React from 'react';

// Mock RoleContext with default values
export const RoleContext = React.createContext({
  user: { id: "test", name: "Test User", role: "guest" },
  setRole: () => {}
});

export const useRole = () => ({
  user: { id: "test", name: "Test User", role: "guest" }
});