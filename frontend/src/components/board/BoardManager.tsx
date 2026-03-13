import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { db } from "../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { boardSchema, type BoardFormData } from "../../validations/board.schema";
import { triggerSyncIfOnline } from "../../lib/taskMutations";
import { useState } from "react";
import ShareBoardModal from "./ShareBoardModal";

interface BoardManagerProps {
    isOpen: boolean;
    onClose: () => void;
    activeBoardId: string;
    onBoardSelect: (id: string) => void;
}

export default function BoardManager({ isOpen, onClose, activeBoardId, onBoardSelect }: BoardManagerProps) {
    const boards = useLiveQuery(() => db.boards.where("syncStatus").notEqual("deleted").toArray());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [sharingBoardId, setSharingBoardId] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<BoardFormData>({
        resolver: zodResolver(boardSchema),
    });

    const {
        register: registerEdit,
        handleSubmit: handleEditSubmit,
        reset: resetEdit,
        formState: { errors: editErrors },
    } = useForm<BoardFormData>({
        resolver: zodResolver(boardSchema),
    });

    if (!isOpen) return null;

    const onCreate = async (data: BoardFormData) => {
        const tempId = `temp_board_${Date.now()}`;
        await db.transaction("rw", db.boards, db.boardMutations, async () => {
            await db.boards.put({
                _id: tempId,
                name: data.name,
                userId: "local",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncStatus: "created",
            });
            await db.boardMutations.add({
                action: "create",
                boardId: tempId,
                payload: { name: data.name },
                timestamp: Date.now(),
            });
        });
        triggerSyncIfOnline();
        onBoardSelect(tempId);
        reset();
    };

    const onUpdate = async (boardId: string, data: BoardFormData) => {
        await db.transaction("rw", db.boards, db.boardMutations, async () => {
            const board = await db.boards.get(boardId);
            if (board) {
                await db.boards.update(boardId, {
                    name: data.name,
                    syncStatus: board.syncStatus === "created" ? "created" : "updated",
                    updatedAt: new Date().toISOString(),
                });
            }
            await db.boardMutations.add({
                action: "update",
                boardId,
                payload: { name: data.name },
                timestamp: Date.now(),
            });
        });
        triggerSyncIfOnline();
        setEditingId(null);
    };

    const onDelete = async (boardId: string) => {
        if (!confirm("Are you sure? All tasks in this board will be permanently deleted.")) return;

        await db.transaction("rw", db.boards, db.boardMutations, async () => {
            const board = await db.boards.get(boardId);
            if (board?.syncStatus === "created") {
                await db.boards.delete(boardId);
                const pendingMutations = await db.boardMutations.where('boardId').equals(boardId).toArray();
                const mutationIds = pendingMutations.map(m => m.id!);
                await db.boardMutations.bulkDelete(mutationIds);
            } else {
                await db.boards.update(boardId, { syncStatus: "deleted" });
                await db.boardMutations.add({
                    action: "delete",
                    boardId,
                    timestamp: Date.now(),
                });
            }
        });
        triggerSyncIfOnline();

        if (activeBoardId === boardId) {
            const remaining = await db.boards.where("syncStatus").notEqual("deleted").toArray();
            if (remaining.length > 0) onBoardSelect(remaining[0]._id);
        }
    };

    const startEditing = (boardId: string, currentName: string) => {
        setEditingId(boardId);
        resetEdit({ name: currentName });
    };

    const openShareModal = (boardId: string) => {
        setSharingBoardId(boardId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {sharingBoardId && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
                    {/* We will render ShareBoardModal here when we build it */}
                    <ShareBoardModal boardId={sharingBoardId} onClose={() => setSharingBoardId(null)} />
                </div>
            )}
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Boards</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Create New Board */}
                    <form onSubmit={handleSubmit(onCreate)} className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Create New Board
                        </label>
                        <div className="flex gap-2">
                            <input
                                {...register("name")}
                                className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                placeholder="E.g., Design Tasks"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                    </form>

                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>

                    {/* List Existing Boards */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Your Boards</h4>
                        {boards?.length === 0 ? (
                            <p className="text-sm text-gray-500">No boards created yet.</p>
                        ) : (
                            boards?.map(board => (
                                <div key={board._id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${activeBoardId === board._id
                                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20"
                                        : "border-gray-200 dark:border-gray-700"
                                        }`}
                                >
                                    {editingId === board._id ? (
                                        <form onSubmit={handleEditSubmit((data) => onUpdate(board._id, data))} className="flex-1 flex gap-2 w-full">
                                            <div className="flex-1">
                                                <input
                                                    {...registerEdit("name")}
                                                    autoFocus
                                                    className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                                {editErrors.name && <p className="mt-1 text-[10px] text-red-500">{editErrors.name.message}</p>}
                                            </div>
                                            <button type="submit" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">Save</button>
                                            <button type="button" onClick={() => setEditingId(null)} className="text-xs font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                                        </form>
                                    ) : (
                                        <>
                                            <div
                                                className="flex-1 font-medium text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                                                onClick={() => onBoardSelect(board._id)}
                                            >
                                                {board.name}
                                                {activeBoardId === board._id && <span className="ml-2 text-[10px] text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">Active</span>}
                                                {board.syncStatus !== "synced" && <span className="ml-2 text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Syncing...</span>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {board.myRole === 'admin' && (
                                                    <>
                                                        <button onClick={() => openShareModal(board._id)} className="text-gray-400 hover:text-green-600 ml-1">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                        </button>
                                                        <button onClick={() => startEditing(board._id, board.name)} className="text-gray-400 hover:text-indigo-600 ml-1">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </button>
                                                        {boards.length > 1 && (
                                                            <button onClick={() => onDelete(board._id)} className="text-gray-400 hover:text-red-600 ml-1">
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
