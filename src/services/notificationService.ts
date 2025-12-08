// Mock notification service for build purposes

export function listenNotifications(userId: string, callback: (notifications: any[]) => void) {
  // Mock implementation
  callback([]);
  return () => {};
}

export async function pushNotification(userId: string, notification: any) {
  // Mock implementation
  return notification;
}

export async function deleteNotification(userId: string, notificationId: string) {
  // Mock implementation
  return true;
}