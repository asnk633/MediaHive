// src/app/api/_lib/realtime.ts
// Realtime utilities for SSE and WebSocket connections

import { EventEmitter } from 'events';

// In-memory store for SSE connections (in production, this would use Redis or similar)
const sseConnections = new Map<string, any>();
const websocketConnections = new Map<string, WebSocket>();

// Event emitter for broadcasting updates
const eventEmitter = new EventEmitter();

/**
 * Register an SSE connection
 * 
 * @param userId User ID
 * @param connection SSE connection object
 */
export function registerSSEConnection(userId: string, connection: any) {
  sseConnections.set(userId, connection);
}

/**
 * Unregister an SSE connection
 * 
 * @param userId User ID
 */
export function unregisterSSEConnection(userId: string) {
  sseConnections.delete(userId);
}

/**
 * Register a WebSocket connection
 * 
 * @param userId User ID
 * @param connection WebSocket connection object
 */
export function registerWebSocketConnection(userId: string, connection: WebSocket) {
  websocketConnections.set(userId, connection);
}

/**
 * Unregister a WebSocket connection
 * 
 * @param userId User ID
 */
export function unregisterWebSocketConnection(userId: string) {
  websocketConnections.delete(userId);
}

/**
 * Broadcast an event to all connected clients
 * 
 * @param channel Channel name
 * @param data Event data
 */
export function broadcastEvent(channel: string, data: any) {
  // Broadcast via SSE
  sseConnections.forEach((connection, userId) => {
    try {
      connection.write(`event: ${channel}\n`);
      connection.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.warn(`Failed to send SSE event to user ${userId}:`, error);
      unregisterSSEConnection(userId);
    }
  });

  // Broadcast via WebSocket
  websocketConnections.forEach((connection, userId) => {
    try {
      connection.send(JSON.stringify({ channel, data }));
    } catch (error) {
      console.warn(`Failed to send WebSocket event to user ${userId}:`, error);
      unregisterWebSocketConnection(userId);
    }
  });

  // Emit event for internal listeners
  eventEmitter.emit(channel, data);
}

/**
 * Subscribe to events
 * 
 * @param channel Channel name
 * @param callback Event handler
 */
export function subscribeToEvents(channel: string, callback: (data: any) => void) {
  eventEmitter.on(channel, callback);
}

/**
 * Unsubscribe from events
 * 
 * @param channel Channel name
 * @param callback Event handler
 */
export function unsubscribeFromEvents(channel: string, callback: (data: any) => void) {
  eventEmitter.off(channel, callback);
}

/**
 * Send an event securely to a specific connection
 * 
 * @param connectionKey Key of the connection (e.g. `notification-${userId}`)
 * @param channel Channel name
 * @param data Event data
 */
export function sendToConnection(connectionKey: string, channel: string, data: any) {
  const connection = sseConnections.get(connectionKey);
  if (connection) {
    try {
      connection.write(`event: ${channel}\n`);
      connection.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.warn(`Failed to send SSE event to connection ${connectionKey}:`, error);
      sseConnections.delete(connectionKey);
    }
  }
}

