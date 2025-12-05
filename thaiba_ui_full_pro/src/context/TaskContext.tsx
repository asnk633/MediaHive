// Mock TaskContext for build purposes
import React, { createContext, useContext } from 'react';

const TaskContext = createContext<any>({
  tasks: [],
  loading: false,
});

export function useTasks() {
  return useContext(TaskContext);
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  return (
    <TaskContext.Provider value={{
      tasks: [],
      loading: false,
    }}>
      {children}
    </TaskContext.Provider>
  );
}