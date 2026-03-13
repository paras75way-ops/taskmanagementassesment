import { useState, useEffect } from "react";
import Select from "react-select";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { queueAddDependency, queueRemoveDependency, detectCycleFrontend } from "../../lib/taskMutations";
import type { LocalTask } from "../../types/task";
import { XIcon, XCircleIcon } from "../../assets/icons";

interface DependencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: LocalTask;
}

export default function DependencyModal({ isOpen, onClose, task }: DependencyModalProps) {
    const [selectedBlocker, setSelectedBlocker] = useState<{ value: string; label: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const allTasks = useLiveQuery(
        () => db.tasks.filter(t => t._id !== task._id && t.syncStatus !== "deleted").toArray()
    ) ?? [];

    const currentBlockers = useLiveQuery(
        () => db.tasks.filter(t => (task.blockedBy || []).includes(t._id)).toArray(),
        [task.blockedBy]
    ) ?? [];

    useEffect(() => {
        if (!isOpen) {
            setSelectedBlocker(null);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const options = allTasks.map(t => ({
        value: t._id,
        label: `[${t.status.toUpperCase()}] ${t.title}`
    }));

    const handleAddDependency = async () => {
        if (!selectedBlocker) return;
        setError(null);

        const newBlockerId = selectedBlocker.value;
        const currentBlockedBy = task.blockedBy || [];

        if (currentBlockedBy.includes(newBlockerId)) {
            setError("Task is already blocked by this task.");
            return;
        }

        try {
            const hasCycle = await detectCycleFrontend(task._id, [...currentBlockedBy, newBlockerId]);
            if (hasCycle) {
                setError("Circular dependency detected. This change would create a cycle.");
                return;
            }

            await queueAddDependency(task._id, newBlockerId);
            setSelectedBlocker(null);
        } catch (err: unknown) {
            setError((err as Error).message || "Failed to add dependency");
        }
    };

    const handleRemoveDependency = async (blockerId: string) => {
        try {
            await queueRemoveDependency(task._id, blockerId);
        } catch (err: unknown) {
            setError((err as Error).message || "Failed to remove dependency");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Dependencies</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Task is blocked by:
                        </h3>
                        {currentBlockers.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No dependencies currently.</p>
                        ) : (
                            <ul className="space-y-2">
                                {currentBlockers.map(blocker => (
                                    <li key={blocker._id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 rounded-md p-2">
                                        <span className={`text-sm ${blocker.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                            [{blocker.status.toUpperCase()}] {blocker.title}
                                        </span>
                                        <button
                                            onClick={() => handleRemoveDependency(blocker._id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded-md transition"
                                            title="Remove dependency"
                                        >
                                            <XCircleIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Add new blocker
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 text-gray-900">
                                <Select
                                    value={selectedBlocker}
                                    onChange={(newValue) => setSelectedBlocker(newValue as { value: string; label: string } | null)}
                                    options={options}
                                    placeholder="Search tasks..."
                                    className="text-sm"
                                    classNamePrefix="react-select"
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                    maxMenuHeight={220}
                                    styles={{
                                        menuPortal: base => ({ ...base, zIndex: 9999 }),
                                        control: base => ({
                                            ...base,
                                            backgroundColor: 'transparent',
                                            borderColor: 'currentColor',
                                            color: 'currentColor',
                                        }),
                                        singleValue: base => ({
                                            ...base,
                                            color: 'currentColor',
                                        }),
                                        input: base => ({
                                            ...base,
                                            color: 'currentColor',
                                        }),
                                        menu: base => ({
                                            ...base,
                                            backgroundColor: 'rgb(31, 41, 55)',
                                            border: '1px solid rgb(55, 65, 81)',
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isFocused ? 'rgb(55, 65, 81)' : 'transparent',
                                            color: 'rgb(243, 244, 246)',
                                            cursor: 'pointer',
                                            '&:active': {
                                                backgroundColor: 'rgb(75, 85, 99)',
                                            }
                                        }),
                                    }}
                                />
                            </div>
                            <button
                                onClick={handleAddDependency}
                                disabled={!selectedBlocker}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            >
                                Add
                            </button>
                        </div>
                        {error && (
                            <p className="mt-2 text-sm text-red-500">{error}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
