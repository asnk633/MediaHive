import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, institutions } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { validateSchema, createUserSchema, updateUserSchema } from '@/lib/validation';
import { z } from 'zod';
import { sanitizeTextContent, sanitizeUrl } from '@/lib/sanitizer';
import { authorizeByPermission } from '@/app/api/_lib/rbac';

const VALID_ROLES = ['admin', 'team', 'guest'] as const;

// --- GET Request Handler ---
export async function GET(request: NextRequest) {
  try {
    // Authorize user with RBAC - users can read, but admins can see all
    const user = await authorizeByPermission(request, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user by ID
    if (id) {
      // Validate ID parameter
      const idSchema = z.number().int().positive();
      try {
        idSchema.parse(parseInt(id));
      } catch {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Remove passwordHash from response
      const { passwordHash, ...userWithoutPassword } = user[0];
      return NextResponse.json(userWithoutPassword, { status: 200 });
    }

    // List users with filtering, search, and pagination
    // Validate query parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    // Apply trim and store the result
    const search = searchParams.get('search')?.trim(); 
    const role = searchParams.get('role');
    const institutionId = searchParams.get('institutionId');

    const conditions: any[] = [];

    if (institutionId && !isNaN(parseInt(institutionId))) {
      conditions.push(eq(users.institutionId, parseInt(institutionId)));
    }

    if (role && VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      conditions.push(eq(users.role, role));
    }

    // Only add search condition if search term is non-empty after trimming
    if (search && search.length > 0) {
      const likePattern = `%${search}%`;
      // Search by name or email
      conditions.push(
        or(
          // Assuming 'name' is the correct column based on your original code
          like((users as any).name, likePattern),
          like(users.email, likePattern)
        )
      );
    }

    const usersList = await db
      .select()
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));

    // Filter out password hashes before sending
    const usersWithoutPasswords = usersList.map(({ passwordHash, ...user }) => user);

    return NextResponse.json(usersWithoutPasswords, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + ((error as Error)?.message ?? String(error)) },
      { status: 500 }
    );
  }
}

// --- POST Request Handler (Create a new user) ---
export async function POST(request: NextRequest) {
  try {
    // Authorize user with RBAC - only admins can create users
    const user = await authorizeByPermission(request, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Only admins can create users' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, role, fullName: name, institutionId, tenantId } = validateSchema(createUserSchema, body);
    const avatarUrl = body.avatarUrl; // avatarUrl is not part of the schema but can be included

    // Check if email already exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use', code: 'EMAIL_IN_USE' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    const inserted = await db
      .insert(users)
      // cast values payload to any to avoid Drizzle overload mismatch
      .values({
        createdAt,
        email,
        passwordHash,
        role,
        fullName: sanitizeTextContent(name.trim()),
        avatarUrl: avatarUrl ? sanitizeUrl(avatarUrl) : null,
        institutionId,
        tenantId: 1, // Default tenant ID for now
      } as any)
      .returning();

    // Remove passwordHash from response
    const { passwordHash: _, ...newUser } = inserted[0];

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + ((error as Error)?.message ?? String(error)) },
      { status: 500 }
    );
  }
}

// --- PUT Request Handler (Update an existing user) ---
export async function PUT(request: NextRequest) {
  try {
    // Authorize user with RBAC - only admins can update users
    const user = await authorizeByPermission(request, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Only admins can update users' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const updates = await request.json();
    const validatedUpdates = validateSchema(updateUserSchema, updates);

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Only allow specific fields to be updated
    const safeUpdates: any = {};
    if (validatedUpdates.email) safeUpdates.email = validatedUpdates.email;
    if (validatedUpdates.role && VALID_ROLES.includes(validatedUpdates.role)) safeUpdates.role = validatedUpdates.role;
    if (validatedUpdates.fullName) safeUpdates.fullName = sanitizeTextContent(validatedUpdates.fullName.trim());
    if (updates.avatarUrl !== undefined) safeUpdates.avatarUrl = updates.avatarUrl ? sanitizeUrl(updates.avatarUrl) : null; // Allow null to clear
    // Handle password update separately
    if (updates.password) safeUpdates.passwordHash = await bcrypt.hash(updates.password, 10);
    if (validatedUpdates.institutionId) safeUpdates.institutionId = validatedUpdates.institutionId;
    if (validatedUpdates.tenantId) safeUpdates.tenantId = validatedUpdates.tenantId;

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update', code: 'NO_VALID_FIELDS' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(users)
      .set({ ...safeUpdates, updatedAt: new Date().toISOString() })
      .where(eq(users.id, parseInt(id)))
      .returning();

    // Remove passwordHash from response
    const { passwordHash: _, ...updatedUser } = updated[0];

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.fieldErrors },
        { status: 400 }
      );
    }
    
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + ((error as Error)?.message ?? String(error)) },
      { status: 500 }
    );
  }
}

// --- DELETE Request Handler ---
export async function DELETE(request: NextRequest) {
  try {
    // Authorize user with RBAC - only admins can delete users
    const user = await authorizeByPermission(request, 'manage:users');
    if (!user) {
      return NextResponse.json({ error: 'Forbidden: Only admins can delete users' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete user
    const deleted = await db
      .delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete user', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    // Remove passwordHash from response
    const { passwordHash: _, ...deletedUserWithoutPassword } = deleted[0];

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        deleted: deletedUserWithoutPassword,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + ((error as Error)?.message ?? String(error)) },
      { status: 500 }
    );
  }
}