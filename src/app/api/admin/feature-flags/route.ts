// src/app/api/admin/feature-flags/route.ts
// Dev-only feature flag management API

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { isFeatureEnabled, getAllFeatureFlags } from '@/app/featureFlags';

// Ensure this endpoint is only available in development
const isDevEnvironment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_E2E === '1';

export async function GET(req: NextRequest) {
  // Only available in dev environment
  if (!isDevEnvironment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Authorize user - only admins can access feature flags
  const user = await authorizeByPermission(req, 'manage:users');
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const flags = getAllFeatureFlags();
    return NextResponse.json({ flags }, { status: 200 });
  } catch (error) {
    console.error('Feature flags GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Only available in dev environment
  if (!isDevEnvironment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Authorize user - only admins can update feature flags
  const user = await authorizeByPermission(req, 'manage:users');
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { feature, enabled } = body;

    if (!feature) {
      return NextResponse.json({ error: 'Feature name is required' }, { status: 400 });
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Enabled must be a boolean' }, { status: 400 });
    }

    // In a real implementation, you would persist this to a database or config file
    // For this demo, we'll just log the change
    console.log(`Feature flag ${feature} set to ${enabled}`);

    return NextResponse.json({
      success: true,
      message: `Feature flag ${feature} updated to ${enabled}`
    }, { status: 200 });
  } catch (error) {
    console.error('Feature flags PUT error:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}