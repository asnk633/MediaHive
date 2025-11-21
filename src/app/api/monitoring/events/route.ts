// src/app/api/monitoring/events/route.ts
// SSE endpoint for monitoring events

import { NextRequest } from 'next/server';
import { authorizeByPermission } from '../../_lib/rbac';
import { registerSSEConnection, unregisterSSEConnection } from '../../_lib/realtime';

export async function GET(req: NextRequest) {
  // Authorize user with RBAC - only admin can access monitoring
  const user = await authorizeByPermission(req, 'admin:monitoring');
  if (!user || user.role !== 'admin') {
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
      
      registerSSEConnection(`monitoring-${user.id}`, connection);
      
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
        unregisterSSEConnection(`monitoring-${user.id}`);
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