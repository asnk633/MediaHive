"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContextProvider";
import { supabase } from "@/lib/supabaseClient";
import ChatLayout from "@/components/chat/ChatLayout";

export default function ChatPage() {
  const { user, loading: authLoading } = useAuth();
  const [currentUserProfile, setCurrentUserProfile] = useState<any | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const userId = user.id;

    async function loadChatData() {
      try {
        // 1. Load current user profile details
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) throw profileError;

        const tenantId = profile?.tenant_id;
        if (!tenantId) {
          console.warn("No tenant ID found for user:", userId);
          setLoading(false);
          return;
        }

        const mappedCurrentUser = {
          id: profile.id,
          fullName: profile.full_name || profile.name || "User",
          role: profile.role || "member",
          tenantId: tenantId,
          avatarUrl: profile.avatar_url,
          avatarDriveId: profile.avatar_drive_id
        };
        setCurrentUserProfile(mappedCurrentUser);

        // 2. Load all user profiles within the same tenant
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .eq("tenant_id", tenantId);

        if (profilesError) throw profilesError;
        setAllUsers(profiles || []);

        // 3. Load initial list of chat rooms where user is participant
        const { data: myParticipants, error: partError } = await supabase
          .from("chat_participants")
          .select("room_id")
          .eq("user_id", userId);

        if (partError) throw partError;
        
        const roomIds = (myParticipants || []).map((p: any) => p.room_id);
        
        if (roomIds.length > 0) {
          const { data: chatRooms, error: roomsError } = await supabase
            .from("chat_rooms")
            .select("*")
            .in("id", roomIds)
            .order("last_message_time", { ascending: false, nullsFirst: false });

          if (roomsError) throw roomsError;
          setRooms(chatRooms || []);
        } else {
          setRooms([]);
        }
      } catch (err) {
        console.error("Failed to load chat bootstrap data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadChatData();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3 text-zinc-400 text-xs">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          Setting up Chat workspace...
        </div>
      </div>
    );
  }

  if (!currentUserProfile) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <div className="text-zinc-400 text-sm font-light">
          Unable to establish session. Please verify user profile configuration.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden">
      <ChatLayout 
        currentUser={currentUserProfile} 
        initialRooms={rooms} 
        allUsers={allUsers} 
      />
    </div>
  );
}
