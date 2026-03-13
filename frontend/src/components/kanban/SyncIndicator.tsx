import { useLiveQuery } from "dexie-react-hooks";
import { useSyncStatus } from "../../hooks/useSyncStatus";
import { db } from "../../lib/db";

export default function SyncIndicator() {
    const { isOnline, isSyncing } = useSyncStatus();


    const pendingCount = useLiveQuery(() => db.mutations.count(), []);

    if (isSyncing) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium border border-yellow-200 dark:border-yellow-800 shadow-sm transition-all">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Syncing...
            </div>
        );
    }

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-full text-xs font-medium border border-red-200 dark:border-red-800 shadow-sm transition-all opacity-90">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Offline {pendingCount ? `(${pendingCount} pending)` : ""}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium border border-emerald-200 dark:border-emerald-800 shadow-sm transition-all opacity-50 hover:opacity-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Online
        </div>
    );
}
