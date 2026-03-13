import { useEffect } from "react";
import { useSyncStatus } from "../hooks/useSyncStatus";
import { pullData } from "../lib/sync";
import type { IUser } from "../types/auth";

export default function SyncProvider({ children, user }: { children: React.ReactNode; user: IUser | null }) {
    const { isOnline } = useSyncStatus();

    useEffect(() => {
        console.log("SyncProvider Mounted. Stats:", { isOnline, isAuthenticated: !!user });

        if (isOnline && user) {
            pullData();


            const interval = setInterval(() => {
                pullData();
                console.log("called syncprovider");

            }, 30000);

            return () => clearInterval(interval);
        }
    }, [isOnline, user]);



    return <>{children}</>;
}
