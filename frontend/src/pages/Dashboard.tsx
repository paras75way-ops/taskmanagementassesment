import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import KanbanBoard from "../components/kanban/KanbanBoard";
import BoardSelector from "../components/board/BoardSelector";
import BoardManager from "../components/board/BoardManager";

export default function Dashboard() {
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [isBoardManagerOpen, setIsBoardManagerOpen] = useState(false);

    const firstBoard = useLiveQuery(() => db.boards.where("syncStatus").notEqual("deleted").first());

    useEffect(() => {
        if (!activeBoardId && firstBoard) {
            setActiveBoardId(firstBoard._id);
        }
    }, [firstBoard, activeBoardId]);

    const currentBoardIsValid = useLiveQuery(
        () => activeBoardId ? db.boards.get(activeBoardId).then(b => !!b && b.syncStatus !== "deleted") : Promise.resolve(false),
        [activeBoardId]
    );

    useEffect(() => {
        if (activeBoardId && currentBoardIsValid === false && firstBoard) {
            setActiveBoardId(firstBoard._id);
        }
    }, [currentBoardIsValid, activeBoardId, firstBoard]);


    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="flex items-center gap-4 flex-1 max-w-sm">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">Active Board:</span>
                    <BoardSelector
                        value={activeBoardId}
                        onChange={setActiveBoardId}
                        className="w-full"
                    />
                </div>
                <button
                    onClick={() => setIsBoardManagerOpen(true)}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                >
                    Manage Boards
                </button>
            </div>

            {activeBoardId ? (
                <div className="flex-1 min-h-0">
                    <KanbanBoard boardId={activeBoardId} />
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <p className="mb-4 text-lg">You don't have any boards yet.</p>
                    <button
                        onClick={() => setIsBoardManagerOpen(true)}
                        className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-sm"
                    >
                        Create your first board
                    </button>
                </div>
            )}

            <BoardManager
                isOpen={isBoardManagerOpen}
                onClose={() => setIsBoardManagerOpen(false)}
                activeBoardId={activeBoardId || ""}
                onBoardSelect={setActiveBoardId}
            />
        </div>
    );
}