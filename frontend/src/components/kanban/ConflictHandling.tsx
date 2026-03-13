import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";

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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}
