import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { EmailService } from '@/services/emailService';
import { verifyUser, getSupabaseAdmin } from '@/lib/verifyUser';

/**
 * API Route: /api/invites/send
 * Handles secure invitation creation and (optionally) email dispatch.
 */
export async function POST(req: Request) {
    try {
        const user = await verifyUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const supabaseAdmin = getSupabaseAdmin();

        // 2. Parse request
        const { email, workspaces } = await req.json();
        if (!email || !workspaces) {
            return NextResponse.json({ error: 'Email and workspaces are required' }, { status: 400 });
        }

        // 3. Generate token and expiry
        const token = crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).substring(2);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // 4. Create Invitation Record
        const { data: invite, error: inviteError } = await supabaseAdmin
            .from('invites')
            .insert({
                email,
                token,
                invited_by: user.uid,
                tenant_id: user.tenant_id,
                expires_at: expiresAt.toISOString(),
                metadata: { invited_workspaces: workspaces }
            })
            .select()
            .single();

        if (inviteError) throw inviteError;

        // 5. Dispatch Branded Email
        const inviteLink = `${new URL(req.url).origin}/accept-invite?token=${token}`;
        
        // Determine institution name for email context
        let institutionName = 'MediaHive';
        const wsIds = Object.keys(workspaces);
        if (wsIds.length === 1) {
            const { data: inst } = await supabaseAdmin.from('institutions').select('name').eq('id', wsIds[0]).single();
            if (inst) institutionName = inst.name;
        } else if (wsIds.length > 1) {
            institutionName = `${wsIds.length} Workspaces`;
        }

        await EmailService.sendInvitation(email, inviteLink, institutionName);

        return NextResponse.json({ 
            success: true, 
            inviteId: invite.id,
            link: inviteLink 
        });

    } catch (error: any) {
        console.error('[INVITE API] Failure:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
