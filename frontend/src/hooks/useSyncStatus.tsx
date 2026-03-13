import { useState, useEffect, useCallback } from "react";
import { processMutations } from "../lib/sync";

export function useSyncStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== "undefined" ? navigator.onLine : true
    );
    const [isSyncing, setIsSyncing] = useState(false);

    const handleOnline = useCallback(async () => {
        setIsOnline(true);
        setIsSyncing(true);
        try {
            await processMutations();
        } catch (err) {
            console.error("Failed to process offline mutations on reconnect:", err);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
    }, []);

    useEffect(() => {
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial check in case we mounted while offline
        if (!navigator.onLine) {
            setIsOnline(false);
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [handleOnline, handleOffline]);

    // Expose manual sync trigger
    const triggerSync = async () => {
        if (!isOnline) return;
        setIsSyncing(true);
        try {
            await processMutations();
        } finally {
            setIsSyncing(false);
        }
    };

    return { isOnline, isSyncing, triggerSync };
}
