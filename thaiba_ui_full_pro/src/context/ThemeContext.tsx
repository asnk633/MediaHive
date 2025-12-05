// Mock ThemeContext for build purposes
import React, { createContext, useContext } from 'react';

const ThemeContext = createContext<any>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{
      theme: 'dark',
      toggleTheme: () => {},
    }}>
      {children}
    </ThemeContext.Provider>
  );
}