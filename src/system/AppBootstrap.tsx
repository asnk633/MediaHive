"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContextProvider"
import { startRealtimeSync } from "@/system/realtimeSync"
import { queryClient } from "@/providers/ReactQueryProvider"
import { logPerformance } from "@/system/performanceLogger"

/**
 * AppBootstrap
 * 
 * The single source of truth for post-authentication lifecycle management.
 * 
 * Responsibilities:
 * 1. Initialize Realtime Synchronization (Supabase).
 * 2. Invalidate stale queries upon login to ensure fresh data.
 * 3. Log boot performance metrics.
 */
export default function AppBootstrap() {
    const { user, loading } = useAuth()
    const bootStarted = useRef(false)

    useEffect(() => {
        // If auth is still loading, do nothing
        if (loading) return

        // If no user is present, we are in a logged-out state (or login page)
        if (!user) {
            bootStarted.current = false
            return
        }

        // Prevent double-booting if the component re-renders
        if (bootStarted.current) return
        bootStarted.current = true

        const start = performance.now()
        console.log("%c[BOOT] %cMediaHive bootstrap starting...", "color: #10b981; font-weight: bold;", "color: #fff;")

        try {
            // 1. Start Realtime Sync (now async to check session)
            startRealtimeSync()

            // 2. Invalidate core queries to ensure data freshness on boot
            // We use invalidate instead of refetch to allow the existing cache 
            // (from hydration/persistence) to be shown while background update happens.
            queryClient.invalidateQueries({ queryKey: ["tasks"] })
            queryClient.invalidateQueries({ queryKey: ["events"] })
            queryClient.invalidateQueries({ queryKey: ["campaigns"] })

            logPerformance("App Bootstrap Complete", start)
        } catch (error) {
            console.error("[BOOT] Fatal error during bootstrap:", error)
        }
    }, [user, loading])

    return null
}
