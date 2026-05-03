"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContextProvider"
import { AppLoader } from "@/components/ui/AppLoader"

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            console.warn("[AUTH GATE] No user — redirecting to /login")
            router.replace("/login")
        }
    }, [loading, user, router])

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-night-sky z-[8000]">
                <AppLoader />
            </div>
        )
    }

    if (!user) {
        return null
    }

    console.log("[AUTH GATE] user verified:", user.uid)

    return <>{children}</>
}
