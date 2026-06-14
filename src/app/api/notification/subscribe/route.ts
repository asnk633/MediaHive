import { NextRequest } from 'next/server';
import { verifyUser } from '@/lib/verifyUser';
import { registerSSEConnection, unregisterSSEConnection } from '../../_lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Authenticate user
  const user = await verifyUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const userId = user.uid || user.id;
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Invalid user context' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const connectionKey = `notification-${userId}`;

  // 2. Establish SSE Stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection payload
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

      const connection = {
        write: (data: string) => {
          try {
            controller.enqueue(data);
          } catch (error) {
            console.warn(`Failed to write to SSE stream for connection ${connectionKey}:`, error);
          }
        }
      };

      registerSSEConnection(connectionKey, connection);

      // Keep-alive mechanism to prevent timeouts (30s)
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(':keep-alive\n\n');
        } catch (error) {
          clearInterval(keepAliveInterval);
        }
      }, 30000);

      // Cleanup when connection is closed
      req.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        unregisterSSEConnection(connectionKey);
        try {
          controller.close();
        } catch (error) {
          // Ignore close errors
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
