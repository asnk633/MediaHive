
import { useEffect, useState } from "react";

export type NetworkState = "online" | "offline" | "reconnecting";

export function useNetworkStatus() {
    const [state, setState] = useState<NetworkState>(
        typeof navigator !== "undefined" && navigator.onLine
            ? "online"
            : "offline"
    );

    useEffect(() => {
        const onOnline = () => setState("reconnecting");
        const onOffline = () => setState("offline");

        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);

        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, []);

    // auto-clear reconnecting → online
    useEffect(() => {
        if (state === "reconnecting") {
            const t = setTimeout(() => setState("online"), 1500);
            return () => clearTimeout(t);
        }
    }, [state]);

    return state;
}
