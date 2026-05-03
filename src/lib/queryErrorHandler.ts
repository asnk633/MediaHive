import { toast } from "sonner";

export function handleQueryError(error: any) {
    // Centralized logging
    console.warn("[API Error Trace]", {
        status: error?.status,
        message: error?.message,
        data: error?.data,
        timestamp: new Date().toISOString()
    });

    // User-facing notifications for specific scenarios
    if (error?.status === 401) {
        toast.error("Session expired. Please log in again.", { id: 'auth-error' });
        return;
    }

    if (error?.status === 403) {
        toast.error("You don't have permission to perform this action.");
        return;
    }

    if (error?.status >= 500) {
        toast.error("Server error. We're working on it!");
        return;
    }

    // Generic network or unexpected error
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        toast.error("Network issue. Retrying...");
    }
}
