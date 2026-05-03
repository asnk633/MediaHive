import { supabase } from '@/lib/supabaseClient';

export const OnboardingService = {
    /**
     * Validate an invitation token and return the invite data if valid.
     */
    validateToken: async (token: string) => {
        try {
            const { data, error } = await supabase
                .from('invites')
                .select('*')
                .eq('token', token)
                .eq('status', 'pending')
                .single();

            if (error || !data) {
                console.error('[OnboardingService] Token validation failed:', error);
                return null;
            }

            // Check expiry
            if (new Date(data.expires_at) < new Date()) {
                console.warn('[OnboardingService] Token expired');
                await supabase.from('invites').update({ status: 'expired' }).eq('id', data.id);
                return null;
            }

            return data;
        } catch (error) {
            console.error('[OnboardingService] Unexpected error validating token:', error);
            return null;
        }
    },

    /**
     * Accept an invitation: create account, setup profile, and link workspaces.
     */
    acceptInvitation: async (token: string, name: string, password: string) => {
        // 1. Re-validate token to ensure security
        const invite = await OnboardingService.validateToken(token);
        if (!invite) throw new Error('Your invitation is invalid or has expired.');

        console.log(`[OnboardingService] Accepting invite for ${invite.email}`);

        // 2. Create the Auth account
        // Note: Using user_metadata to store tenant_id for the trigger or session context
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: invite.email,
            password,
            options: {
                data: {
                    full_name: name,
                    tenant_id: invite.tenant_id
                }
            }
        });

        if (authError) {
            // Check if user already exists
            if (authError.message.includes("already registered")) {
                console.log("[OnboardingService] User already registered, asking to log in first.");
                throw new Error("You already have an account with this email. Please log in first, and we will automatically connect your new workspaces.");
            }
            console.error('[OnboardingService] Auth signup failed:', authError);
            throw authError;
        }

        const userId = authData.user?.id;
        if (!userId) throw new Error('Account creation failed. Please try again.');

        try {
            // 3. Create the Profile record
            // We use upsert in case a trigger already created a partial profile
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: invite.email,
                    full_name: name,
                    role: 'member', // default role
                    tenant_id: invite.tenant_id,
                    status: 'active',
                    created_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            // 4. Link User to Workspaces
            const invitedWorkspaces = invite.metadata?.invited_workspaces || {};
            const entries = Object.entries(invitedWorkspaces);

            if (entries.length > 0) {
                console.log(`[OnboardingService] Linking user to ${entries.length} workspaces`);
                const institutionInserts = entries.map(([instId, role]) => ({
                    user_id: userId,
                    institution_id: instId,
                    role: role as string,
                    tenant_id: invite.tenant_id,
                    created_at: new Date().toISOString()
                }));

                const { error: instError } = await supabase
                    .from('user_institutions')
                    .insert(institutionInserts);

                if (instError) throw instError;
            }

            // 5. Finalize Invitation
            const { error: inviteUpdateError } = await supabase
                .from('invites')
                .update({ 
                    status: 'accepted', 
                    metadata: { 
                        ...invite.metadata, 
                        accepted_at: new Date().toISOString(),
                        accepted_by_uid: userId
                    } 
                })
                .eq('id', invite.id);

            if (inviteUpdateError) console.warn('[OnboardingService] Failed to mark invite as accepted:', inviteUpdateError);

            return { user: authData.user, session: authData.session };
        } catch (error: any) {
            console.error('[OnboardingService] Post-signup configuration failed:', error);
            // We don't rollback auth signup because that's complex, 
            // but the user will need admin help if this fails halfway.
            throw new Error(`Account created but workspace setup failed: ${error.message}`);
        }
    },

    /**
     * For existing users who log in: check for pending invites and link workspaces.
     */
    autoLinkWorkspaces: async (userId: string, email: string) => {
        try {
            console.log(`[OnboardingService] Checking for pending invites for existing user: ${email}`);
            
            // 1. Fetch pending invites for this email
            const { data: invites, error } = await supabase
                .from('invites')
                .select('*')
                .eq('email', email)
                .eq('status', 'pending');

            if (error) throw error;
            if (!invites || invites.length === 0) return;

            for (const invite of invites) {
                // Check expiry
                if (new Date(invite.expires_at) < new Date()) {
                    await supabase.from('invites').update({ status: 'expired' }).eq('id', invite.id);
                    continue;
                }

                const invitedWorkspaces = invite.metadata?.invited_workspaces || {};
                const entries = Object.entries(invitedWorkspaces);

                if (entries.length > 0) {
                    const institutionInserts = entries.map(([instId, role]) => ({
                        user_id: userId,
                        institution_id: instId,
                        role: role as string,
                        tenant_id: invite.tenant_id,
                        created_at: new Date().toISOString()
                    }));

                    // Use upsert to avoid duplicate key errors if they already have access
                    await supabase
                        .from('user_institutions')
                        .upsert(institutionInserts, { onConflict: 'user_id,institution_id' });
                }

                // Mark as accepted
                await supabase
                    .from('invites')
                    .update({ 
                        status: 'accepted', 
                        metadata: { 
                            ...invite.metadata, 
                            accepted_at: new Date().toISOString(),
                            accepted_by_uid: userId,
                            auto_linked: true
                        } 
                    })
                    .eq('id', invite.id);
            }
            
            console.log(`[OnboardingService] Successfully auto-linked ${invites.length} invitations`);
        } catch (error) {
            console.error('[OnboardingService] Auto-link failed:', error);
        }
    }
};
