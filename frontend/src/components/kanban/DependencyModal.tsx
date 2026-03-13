import { useState, useEffect } from "react";
import Select from "react-select";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { queueAddDependency, queueRemoveDependency, detectCycleFrontend } from "../../lib/taskMutations";
import type { LocalTask } from "../../types/task";

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
        } catch (err: any) {
            setError(err.message || "Failed to add dependency");
        }
    };

    const handleRemoveDependency = async (blockerId: string) => {
        try {
            await queueRemoveDependency(task._id, blockerId);
        } catch (err: any) {
            setError(err.message || "Failed to remove dependency");
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
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
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
                                    onChange={(newValue) => setSelectedBlocker(newValue as any)}
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
                                            borderColor: '#4f46e5', // indigo-600
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
                                            backgroundColor: '#1f2937', // gray-800
                                            border: '1px solid #374151', // gray-700
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isFocused ? '#374151' : 'transparent', // gray-700 on hover
                                            color: '#f3f4f6', // gray-100 text
                                            cursor: 'pointer',
                                            '&:active': {
                                                backgroundColor: '#4b5563', // gray-600
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
