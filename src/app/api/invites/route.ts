import { NextRequest } from 'next/server';
import { verifyUser } from '@/lib/server-utils';
import { InviteServiceServer } from '@/lib/invites.server';
import { isFeatureEnabled } from '@/app/featureFlags';

export async function POST(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (!isFeatureEnabled('inviteAccessLayer')) {
      return Response.json({ error: 'Invite access layer is not enabled' }, { status: 403 });
    }

    // Verify user is authenticated and is admin
    const user = await verifyUser(request);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const { email, role } = await request.json();

    // Validate input
    if (!email || !role) {
      return Response.json({ error: 'Email and role are required' }, { status: 400 });
    }

    if (!['admin', 'team', 'guest'].includes(role)) {
      return Response.json({ error: 'Invalid role. Must be admin, team, or guest' }, { status: 400 });
    }

    // Create the invite
    const inviteId = await InviteServiceServer.createInvite(email, role, user.uid, user.institutionId || 'default');

    // In a real implementation, you would send an email here
    // For now, we'll just return the invite ID for testing
    return Response.json({
      success: true,
      inviteId,
      message: `Invite created successfully for ${email}. In a real implementation, an email would be sent.`
    });
  } catch (error: any) {
    console.error('Error creating invite:', error);
    return Response.json({ error: error.message || 'Failed to create invite' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (!isFeatureEnabled('inviteAccessLayer')) {
      return Response.json({ error: 'Invite access layer is not enabled' }, { status: 403 });
    }

    // Verify user is authenticated and is admin
    const user = await verifyUser(request);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Get all invites for the institution
    const invites = await InviteServiceServer.getInstitutionInvites(user.institutionId || 'default');

    return Response.json({ success: true, invites });
  } catch (error: any) {
    console.error('Error fetching invites:', error);
    return Response.json({ error: error.message || 'Failed to fetch invites' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if feature is enabled
    if (!isFeatureEnabled('inviteAccessLayer')) {
      return Response.json({ error: 'Invite access layer is not enabled' }, { status: 403 });
    }

    // Verify user is authenticated and is admin
    const user = await verifyUser(request);
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    // Get the invite ID from the URL search params
    const url = new URL(request.url);
    const inviteId = url.searchParams.get('id');

    if (!inviteId) {
      return Response.json({ error: 'Invite ID is required' }, { status: 400 });
    }

    // Delete the invite
    await InviteServiceServer.deleteInvite(inviteId);

    return Response.json({ success: true, message: 'Invite deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting invite:', error);
    return Response.json({ error: error.message || 'Failed to delete invite' }, { status: 500 });
  }
}