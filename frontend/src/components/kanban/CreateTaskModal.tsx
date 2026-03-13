import { useState } from "react";
import type { TaskStatus } from "../../types/task";
import { db } from "../../lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { processMutations } from "../../lib/sync";
import { taskSchema } from "../../validations/task.schema";

export interface CreateTaskModalProps {
    boardId: string;
    isOpen: boolean;
    onClose: () => void;
    defaultStatus?: TaskStatus;
}

export default function CreateTaskModal({
    boardId,
    isOpen,
    onClose,
    defaultStatus = "todo",
}: CreateTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const tasksCount = useLiveQuery(
        () => db.tasks.filter((t) => t.status === defaultStatus && t.syncStatus !== "deleted").count(),
        [defaultStatus]
    );

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate using Zod schema
        const validation = taskSchema.safeParse({ title: title.trim(), description: description.trim() || undefined });

        if (!validation.success) {
            // Pick the first error to display
            setError(validation.error.message);
            return;
        }

        const validData = validation.data;

        // Generate a temporary offline ID
        const tempId = crypto.randomUUID();
        const nextPosition = tasksCount ?? 0;

        const payload = {
            title: validData.title,
            description: validData.description,
            status: defaultStatus,
            position: nextPosition,
        };

        // 1. Insert locally
        await db.tasks.add({
            ...payload,
            _id: tempId,
            boardId,
            userId: "local", // Will be overridden by backend upon sync
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: "created",
        });

        // 2. Queue mutation
        await db.mutations.add({
            action: "create",
            taskId: tempId,
            payload: { ...payload, boardId },
            timestamp: Date.now(),
        });

        // Try sync immediately if online
        if (navigator.onLine) {
            processMutations();
        }

        setTitle("");
        setDescription("");
        setError(null);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    New Task
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title…"
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        />
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description… (optional)"
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none transition"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                setTitle("");
                                setDescription("");
                                setError(null);
                                onClose();
                            }}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700
                         text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white
                         hover:bg-indigo-700 transition"
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
