// src/app/api/notifications/subscribe/route.ts
// SSE endpoint for realtime notifications

import { NextRequest } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { registerSSEConnection, unregisterSSEConnection } from '../../_lib/realtime';

export async function GET(req: NextRequest) {
  // Authorize user with RBAC - all authenticated users can subscribe to notifications
  const user = await authorizeByPermission(req, 'read:tasks');
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Create SSE response
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', userId: user.id })}\n\n`);
      
      // Register the connection
      const connection = {
        write: (data: string) => {
          try {
            controller.enqueue(data);
          } catch (error) {
            console.warn('Failed to write to SSE stream:', error);
          }
        }
      };
      
      registerSSEConnection(String(user.id), connection);
      
      // Keep the connection alive
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(':keep-alive\n\n');
        } catch (error) {
          clearInterval(keepAliveInterval);
        }
      }, 30000);
      
      // Handle cleanup when the connection is closed
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        unregisterSSEConnection(String(user.id));
        try {
          controller.close();
        } catch (error) {
          // Ignore errors when closing
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
