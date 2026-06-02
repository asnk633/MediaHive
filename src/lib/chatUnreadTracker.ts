'use client';

import { eventBus } from './eventBus';

const LOCAL_STORAGE_PREFIX = 'mediahive_chat_last_read_';

/**
 * Gets all last read timestamps for a user.
 */
export function getLastReadTimestamps(userId: string): Record<string, string> {
  if (typeof window === 'undefined' || !userId) return {};
  try {
    const data = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('Error reading chat last read timestamps:', err);
    return {};
  }
}

/**
 * Sets the last read timestamp for a specific room.
 */
export function setLastReadTimestamp(userId: string, roomId: string, timestamp?: string): void {
  if (typeof window === 'undefined' || !userId || !roomId) return;
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${userId}`;
    const current = getLastReadTimestamps(userId);
    current[roomId] = timestamp || new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(current));
    
    // Dispatch an event to update listeners immediately
    eventBus.emit('chat_unread_sync');
  } catch (err) {
    console.error('Error writing chat last read timestamp:', err);
  }
}

/**
 * Calculates unread counts client-side if we have the list of messages or last_message_time.
 */
export function calculateRoomUnreads(
  room: any,
  userId: string,
  lastReadTimestamps: Record<string, string>
): number {
  if (!room || !userId) return 0;
  
  const lastReadTimeStr = lastReadTimestamps[room.id];
  const lastMessageTimeStr = room.last_message_time || room.lastMessageTime;
  
  if (!lastMessageTimeStr) return 0;
  
  // If the last message was sent by the current user, there are no new unread messages
  // Wait, how do we know the sender? R.last_message_preview might contain a prefix or sender details,
  // or we can handle it server-side. If we do it server-side, it's 100% accurate!
  
  const lastReadTime = lastReadTimeStr ? new Date(lastReadTimeStr).getTime() : 0;
  const lastMessageTime = new Date(lastMessageTimeStr).getTime();
  
  if (lastMessageTime > lastReadTime) {
    // If the sender of the last message is the current user, it shouldn't show as unread
    // We will handle this cleanly in the API.
    return 1; // Default to 1 unread if newer message exists and client-side count is unknown
  }
  
  return 0;
}
