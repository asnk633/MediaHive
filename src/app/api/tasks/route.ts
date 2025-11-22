import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq, and, desc, like, SQL, count } from 'drizzle-orm';
import { authorizeByPermission, hasRole } from '../_lib/rbac';
import { TaskStatus, TaskPriority } from '@/types';
import { cache } from '@/lib/cache/index';
import { validateSchema, createTaskSchema, updateTaskSchema } from '@/lib/validation';
import { z } from 'zod';
import { sanitizeHtmlContent, sanitizeTextContent } from '@/lib/sanitizer';

// Performance tracking utility
const performanceTracker = {
  start: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`[PERF] ${label}`);
    }
    return Date.now();
  },
  end: (label: string, startTime: number) => {
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`[PERF] ${label}`);
    }
    // Log slow queries (>100ms)
    if (duration > 100) {
      console.warn(`[SLOW QUERY] ${label} took ${duration}ms`);
    }
  }
};

/**
 * GET /api/tasks
 * List tasks with filters based on user role
 * Query params: filter (mine|team|all|review), search, institutionId
 */
export async function GET(req: NextRequest) {
  const perfStart = performanceTracker.start('GET /api/tasks');
  
  try {
    // Authorize user with RBAC - all roles can read tasks
    const authStart = performanceTracker.start('Authorization');
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    performanceTracker.end('Authorization', authStart);

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Create cache key
    const cacheKey = `tasks:${user.institutionId}:${filter}:${search}:${page}:${limit}`;
    
    // Try to get from cache first
    const cacheStart = performanceTracker.start('Cache lookup');
    const cached = cache.get(cacheKey);
    if (cached) {
      performanceTracker.end('Cache lookup', cacheStart);
      performanceTracker.end('GET /api/tasks', perfStart);
      return NextResponse.json(cached, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
          'Vary': 'Accept-Encoding'
        }
      });
    }
    performanceTracker.end('Cache lookup', cacheStart);

    // Build query conditions
    const conditions: SQL[] = [eq(tasks.institutionId, user.institutionId)];

    // Apply role-based filters
    if (filter === 'mine') {
      conditions.push(eq(tasks.assignedToId, user.id));
    } else if (filter === 'review' && !hasRole(user, ['admin'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Apply search filter at database level for better performance
    if (search) {
      const searchTerm = `%${search.toLowerCase()}%`;
      conditions.push(
        like(tasks.title, searchTerm)
      );
    }

    // Get total count for pagination
    const countStart = performanceTracker.start('Count query');
    const [totalCountResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(...conditions));
    
    const totalCount = totalCountResult.count;
    performanceTracker.end('Count query', countStart);

    // Execute the query with optimized pagination
    const queryStart = performanceTracker.start('Main query');
    const result = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        assignedToId: tasks.assignedToId,
        createdById: tasks.createdById,
        institutionId: tasks.institutionId,
        tenantId: tasks.tenantId,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt
      })
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);
    performanceTracker.end('Main query', queryStart);

    const response = { 
      data: result, 
      pagination: { 
        page, 
        limit, 
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      } 
    };
    
    // Cache the response for 30 seconds
    const cacheSetStart = performanceTracker.start('Cache set');
    cache.set(cacheKey, response, 30);
    performanceTracker.end('Cache set', cacheSetStart);
    
    performanceTracker.end('GET /api/tasks', perfStart);
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        'Vary': 'Accept-Encoding'
      }
    });
  } catch (error) {
    console.error('[GET /api/tasks]', error);
    performanceTracker.end('GET /api/tasks', perfStart);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create new task with role-based restrictions
 * Body: { title, description?, priority?, dueDate?, assignedToId? }
 */
export async function POST(req: NextRequest) {
  const perfStart = performanceTracker.start('POST /api/tasks');
  
  try {
    // Authorize user with RBAC - only roles with write:tasks permission can create tasks
    const authStart = performanceTracker.start('Authorization');
    const user = await authorizeByPermission(req, 'write:tasks');
    if (!user) {
      performanceTracker.end('Authorization', authStart);
      performanceTracker.end('POST /api/tasks', perfStart);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    performanceTracker.end('Authorization', authStart);

    const body = await req.json();
    const validatedBody = validateSchema(createTaskSchema, body);

    const now = new Date().toISOString();

    // Role-based field restrictions
    let priority: TaskPriority = 'medium';
    let assignedToId: number | null = null;
    let status: TaskStatus = 'todo';

    if (hasRole(user, ['admin'])) {
      // Admin can set everything
      priority = (body.priority as TaskPriority) || 'medium';
      assignedToId = body.assignedToId || null;
      status = (body.status as TaskStatus) || 'todo';
    } else if (hasRole(user, ['team'])) {
      // Team can set priority and assign
      priority = (body.priority as TaskPriority) || 'medium';
      assignedToId = body.assignedToId || null;
    } else {
      // Guest: create with defaults only
      priority = 'medium';
      assignedToId = null;
      status = 'todo';
    }

    const insertStart = performanceTracker.start('Database insert');
    const [newTask] = await db.insert(tasks).values({
      title: sanitizeTextContent(validatedBody.title.trim()),
      description: validatedBody.description ? sanitizeHtmlContent(validatedBody.description) : null,
      status,
      priority,
      assignedToId,
      createdById: user.id,
      institutionId: user.institutionId,
      tenantId: user.tenantId, // Add missing tenantId
      dueDate: validatedBody.dueDate || null,
      createdAt: now,
      updatedAt: now,
    }).returning({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assignedToId: tasks.assignedToId,
      createdById: tasks.createdById,
      institutionId: tasks.institutionId,
      tenantId: tasks.tenantId,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt
    });
    performanceTracker.end('Database insert', insertStart);

    // Invalidate cache for this institution's tasks
    const cacheInvalidateStart = performanceTracker.start('Cache invalidation');
    cache.invalidatePrefix(`tasks:${user.institutionId}`);
    performanceTracker.end('Cache invalidation', cacheInvalidateStart);

    performanceTracker.end('POST /api/tasks', perfStart);
    return NextResponse.json({ data: newTask }, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Vary': 'Accept-Encoding'
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      performanceTracker.end('POST /api/tasks', perfStart);
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('[POST /api/tasks]', error);
    performanceTracker.end('POST /api/tasks', perfStart);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tasks (bulk update endpoint if needed)
 */
export async function PUT(req: NextRequest) {
  return NextResponse.json(
    { error: 'Use PUT /api/tasks/[id] for updates' },
    { status: 400 }
  );
}

/**
 * DELETE /api/tasks (requires task ID in body for safety)
 */
export async function DELETE(req: NextRequest) {
  const perfStart = performanceTracker.start('DELETE /api/tasks');
  
  try {
    // Authorize user with RBAC - only roles with write:tasks permission can delete tasks
    const authStart = performanceTracker.start('Authorization');
    const user = await authorizeByPermission(req, 'write:tasks');
    if (!user) {
      performanceTracker.end('Authorization', authStart);
      performanceTracker.end('DELETE /api/tasks', perfStart);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    performanceTracker.end('Authorization', authStart);

    const body = await req.json();
    
    // Validate task ID
    const idSchema = z.number().int().positive();
    try {
      idSchema.parse(body.id);
    } catch {
      performanceTracker.end('DELETE /api/tasks', perfStart);
      return NextResponse.json({ error: 'Valid task ID required' }, { status: 400 });
    }
    
    const taskId = body.id;

    // Fetch task to check ownership
    const fetchStart = performanceTracker.start('Fetch task');
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    performanceTracker.end('Fetch task', fetchStart);

    if (!task) {
      performanceTracker.end('DELETE /api/tasks', perfStart);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only admin or creator can delete
    if (!hasRole(user, ['admin']) && task.createdById !== user.id) {
      performanceTracker.end('DELETE /api/tasks', perfStart);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const deleteStart = performanceTracker.start('Database delete');
    await db.delete(tasks).where(eq(tasks.id, taskId));
    performanceTracker.end('Database delete', deleteStart);

    // Invalidate cache for this institution's tasks
    const cacheInvalidateStart = performanceTracker.start('Cache invalidation');
    cache.invalidatePrefix(`tasks:${user.institutionId}`);
    performanceTracker.end('Cache invalidation', cacheInvalidateStart);

    performanceTracker.end('DELETE /api/tasks', perfStart);
    return NextResponse.json({ success: true }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Vary': 'Accept-Encoding'
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      performanceTracker.end('DELETE /api/tasks', perfStart);
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('[DELETE /api/tasks]', error);
    performanceTracker.end('DELETE /api/tasks', perfStart);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}