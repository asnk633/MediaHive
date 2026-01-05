export const notificationService = {
    getNotifications: jest.fn().mockResolvedValue([]),
    markAsRead: jest.fn().mockResolvedValue(true),
    deleteNotification: jest.fn().mockResolvedValue(true),
    createNotification: jest.fn().mockResolvedValue({ id: 'new-notif', createdAt: new Date().toISOString() }),
};
