'use client';

import { useAuth } from "@/contexts/AuthContextProvider";
import LoginClient from "@/components/auth/LoginClient";
import { AppLoader } from "@/components/ui/AppLoader";

export default function HomePage() {
    const { user, loading } = useAuth();

    // BootGate (in RootProviders) handles the authenticated redirect to /home.
    // This component only needs to worry about rendering the login form if unauthenticated.
    // If authenticated, we show a loader while waiting for BootGate to trigger nativeNavigate.

    if (!loading && !user) {
        return <LoginClient />;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-night-sky">
            <AppLoader />
        </div>
    );
}
