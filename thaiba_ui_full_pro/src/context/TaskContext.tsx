import React, { createContext, useContext, useEffect, useState } from 'react';
import { listenTasks } from '../services/taskService';

export const TaskContext = createContext<any>(null);

export const TaskProvider = ({ children }: any) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenTasks((all: any[]) => {
      setTasks(all);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, loading }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
