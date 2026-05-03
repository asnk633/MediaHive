// @ts-nocheck
// Force rebuild: Fix ghost file
import { NextRequest, NextResponse } from 'next/server';

import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';
import { logSystemActivity } from '@/lib/server/activity-logger';


export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const body = await request.json();
        const { name, status } = body;

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        const { data: oldData, error: fetchError } = await supabase
            .from('institutions')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !oldData) {
            return NextResponse.json({ error: 'Institution not found' }, { status: 404 });
        }

        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if (name && typeof name === 'string' && name.trim()) {
            updates.name = name.trim();
        }

        if (status && (status === 'active' || status === 'archived')) {
            updates.status = status;
        }

        const { data: updatedData, error: updateError } = await supabase
            .from('institutions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // Audit Logging
        if (updates.name && oldData?.name !== updates.name) {
            await logSystemActivity({
                actorId: user.uid,
                actorRole: user.role,
                action: 'institution_renamed',
                severity: 'warning',
                entityType: 'institution',
                entityId: id,
                summary: `Institution renamed from '${oldData?.name}' to '${updates.name}'`,
                metadata: {
                    oldName: oldData?.name,
                    newName: updates.name,
                    previousValue: oldData?.name,
                    newValue: updates.name
                }
            });
        }

        return NextResponse.json(updatedData);

    } catch (error: any) {
        console.error('Error updating institution:', error);
        return NextResponse.json({ error: error.message || 'Failed to update institution' }, { status: 500 });
    }
}
