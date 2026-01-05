export const taskService = {
    getTasks: jest.fn().mockResolvedValue([]),
    createTask: jest.fn().mockResolvedValue({ id: 'new-task', createdAt: new Date().toISOString() }),
    updateTask: jest.fn().mockResolvedValue(true),
    deleteTask: jest.fn().mockResolvedValue(true),
    getTaskById: jest.fn().mockResolvedValue({ id: 'task-1', title: 'Mock Task' }),
};
