import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { AlertCircleIcon, XCircleIcon } from "../../assets/icons";

export default function ConflictHandling() {
    const conflicts = useLiveQuery(() => db.conflicts.orderBy("resolvedAt").reverse().toArray());

    if (!conflicts || conflicts.length === 0) return null;

    const handleDismiss = async (id: number) => {
        await db.conflicts.delete(id);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
            {conflicts.map((conflict) => (
                <div
                    key={conflict.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border-l-4 border-yellow-500 overflow-hidden flex"
                >
                    <div className="flex-1 p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertCircleIcon className="h-5 w-5 text-yellow-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Sync Conflict Resolved</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-xs mt-1 leading-relaxed">
                            {conflict.message}
                        </p>
                    </div>
                    <button
                        onClick={() => handleDismiss(conflict.id!)}
                        className="bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        title="Dismiss"
                    >
                        <XCircleIcon className="h-5 w-5" />
                    </button>
                </div>
            ))}
        </div>
    );
}
