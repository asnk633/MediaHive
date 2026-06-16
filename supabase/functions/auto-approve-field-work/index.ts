// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch all pending field work sessions
    const { data: pendingSessions, error: sessionError } = await supabase
      .from("field_work_sessions")
      .select("*")
      .eq("status", "pending_approval");

    if (sessionError) {
      throw new Error(`Failed to fetch pending sessions: ${sessionError.message}`);
    }

    if (!pendingSessions || pendingSessions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending field work sessions to process." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    // 2. Loop through pending sessions and process timeouts
    for (const session of pendingSessions) {
      try {
        const userId = session.userId;
        
        // Fetch user's organizationId
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("organizationId")
          .eq("id", userId)
          .single();

        if (profileError || !profile) {
          console.error(`[Auto-Approve] Profile not found for user ${userId}:`, profileError?.message);
          continue;
        }

        const orgId = profile.organizationId;
        if (!orgId) {
          console.warn(`[Auto-Approve] User ${userId} has no organizationId.`);
          continue;
        }

        // Fetch presence verification settings for organization
        const { data: settings, error: settingsError } = await supabase
          .from("presence_verification_settings")
          .select("autoApproveTimeoutMinutes")
          .eq("organizationId", orgId)
          .maybeSingle();

        if (settingsError) {
          console.error(`[Auto-Approve] Settings error for org ${orgId}:`, settingsError.message);
          continue;
        }

        // Default to 30 minutes timeout if not configured
        const timeoutMinutes = settings?.autoApproveTimeoutMinutes ?? 30;

        const startedAt = new Date(session.startedAt || session.createdAt);
        const timeoutMs = timeoutMinutes * 60 * 1000;
        const now = Date.now();
        const elapsedTime = now - startedAt.getTime();

        if (elapsedTime > timeoutMs) {
          console.log(`[Auto-Approve] Session ${session.id} timed out. Elapsed: ${elapsedTime / 60000} mins, Limit: ${timeoutMinutes} mins. Approving.`);

          // Update status to auto_approved
          const { error: updateError } = await supabase
            .from("field_work_sessions")
            .update({
              status: "auto_approved",
              updatedAt: new Date().toISOString(),
            })
            .eq("id", session.id);

          if (updateError) {
            console.error(`[Auto-Approve] Failed to update session ${session.id}:`, updateError.message);
            continue;
          }

          // Create notification for the user
          const { error: notifyError } = await supabase
            .from("notifications")
            .insert({
              user_id: userId,
              title: "Field Work Auto-Approved",
              body: "Your field work request was automatically approved (manager timeout).",
              type: "field_work",
              route: "/attendance",
              read: false,
              metadata: {
                sessionId: session.id,
                action: "field_work_auto_approved",
              },
            });

          if (notifyError) {
            console.error(`[Auto-Approve] Failed to insert notification for user ${userId}:`, notifyError.message);
          }

          results.push({
            sessionId: session.id,
            userId,
            status: "auto_approved",
            elapsedMinutes: elapsedTime / 60000,
            timeoutLimitMinutes: timeoutMinutes,
          });
        }
      } catch (innerError) {
        console.error(`[Auto-Approve] Error processing session ${session.id}:`, innerError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processedCount: pendingSessions.length,
        approvedCount: results.length,
        approvals: results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Auto-Approve] Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
