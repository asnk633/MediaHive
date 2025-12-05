// Mock task service for build purposes

export function listenTasks(callback: (tasks: any[]) => void) {
  // Mock implementation
  callback([]);
  return () => {};
}