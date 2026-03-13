import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { LocalTask } from "../../types/task";
import { taskSchema } from "../../validations/task.schema";
import ReactMarkdown from "react-markdown";
import { queueTaskUpdate, queueTaskDelete } from "../../lib/taskMutations";
import MoveToBoardModal from "../board/MoveToBoardModal";
import DependencyModal from "./DependencyModal";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
}

interface TaskCardProps {
    task: LocalTask;
}

export default function TaskCard({ task }: TaskCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const [editDesc, setEditDesc] = useState(task.description ?? "");
    const [error, setError] = useState<string | null>(null);
    const [showDependencyModal, setShowDependencyModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const blockers = useLiveQuery(
        () => task.blockedBy?.length
            ? db.tasks.where('_id').anyOf(task.blockedBy).toArray()
            : [],
        [task.blockedBy, task._id]
    ) ?? [];
    const isBlocked = blockers.some((b) => b.status !== "done");

    const dependentTasksCount = useLiveQuery(
        () => db.tasks.filter(t => (t.blockedBy || []).includes(task._id)).count(),
        [task._id]
    ) ?? 0;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleSave = async () => {
        setError(null);

        const validation = taskSchema.safeParse({ title: editTitle.trim(), description: editDesc.trim() || undefined });

        if (!validation.success) {
            setError(validation.error.message);
            return;
        }

        const validData = validation.data;
        await queueTaskUpdate(task._id, {
            title: validData.title,
            description: validData.description,
        });

        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (dependentTasksCount > 0) {
            setShowDeleteConfirm(true);
        } else {
            await queueTaskDelete(task._id);
        }
    };

    const confirmDelete = async () => {
        await queueTaskDelete(task._id);
        setShowDeleteConfirm(false);
    };

    const handleMoveConfirm = async (targetBoardId: string) => {
        await queueTaskUpdate(task._id, {
            boardId: targetBoardId,
            status: "todo",
            position: 0,
        });
        setIsMoving(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
            setEditTitle(task.title);
            setEditDesc(task.description ?? "");
            setError(null);
            setIsEditing(false);
        }
    };

    const isOfflinePending = task.syncStatus !== "synced";

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                className={`group relative bg-white dark:bg-gray-800 rounded-xl border
                    ${task.status === "done" ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/10 dark:bg-emerald-900/10"
                        : isBlocked ? "border-red-400 dark:border-red-600 bg-red-50/10 dark:bg-red-900/10 ring-1 ring-red-400/50"
                            : task.status === "inprogress" ? "border-blue-300 dark:border-blue-700 bg-blue-50/10 dark:bg-blue-900/10"
                                : isOfflinePending ? "border-yellow-300 dark:border-yellow-600 border-dashed" : "border-gray-200 dark:border-gray-700"}
                    p-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing
                    ${isDragging ? "ring-2 ring-indigo-400 shadow-lg z-50" : ""}`}
                {...attributes}
                {...listeners}
            >
                {isEditing ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className={`w-full px-2 py-1 text-sm rounded-md border ${error ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
                        bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                            autoFocus
                        />
                        <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={2}
                            placeholder="Description (optional)"
                            className="w-full px-2 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600
                        bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                        />
                        {error && <p className="text-xs text-red-500">{error}</p>}
                        <div className="flex gap-1.5">
                            <button
                                onClick={handleSave}
                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => {
                                    setEditTitle(task.title);
                                    setEditDesc(task.description ?? "");
                                    setError(null);
                                    setIsEditing(false);
                                }}
                                className="px-2.5 py-1 text-xs font-medium rounded-md bg-gray-200 dark:bg-gray-600
                            text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start gap-2 pr-6">
                            {task.status === "done" && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                            {task.status === "inprogress" && (
                                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0 animate-pulse"></div>
                            )}
                            <p className={`text-sm font-medium leading-snug 
                                ${task.status === "done" ? "text-gray-500 dark:text-gray-400 line-through"
                                    : task.status === "inprogress" ? "text-blue-900 dark:text-blue-100"
                                        : "text-gray-900 dark:text-gray-100"}`}>
                                {task.title}
                            </p>
                        </div>

                        {isBlocked && (
                            <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 w-fit px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                Blocked
                            </div>
                        )}
                        {task.description && (
                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-3 prose prose-sm dark:prose-invert max-w-none 
                                        prose-p:leading-snug prose-p:my-0.5 prose-ul:my-0.5 prose-ol:my-0.5">
                                <ReactMarkdown>{task.description}</ReactMarkdown>
                            </div>
                        )}

                        <div className="mt-2 flex items-center justify-between">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                {task.updatedAt && task.createdAt !== task.updatedAt ? `Updated ${formatTimeAgo(task.updatedAt)}` : task.createdAt ? `Created ${formatTimeAgo(task.createdAt)}` : ''}
                            </p>
                        </div>

                        <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDependencyModal(true);
                                }}
                                className={`p-1 rounded-md transition ${task.blockedBy?.length ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 hover:text-indigo-500'} hover:bg-gray-100 dark:hover:bg-gray-700`}
                                title="Dependencies"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMoving(true);
                                }}
                                className="p-1 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title="Move to Board"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsEditing(true);
                                }}
                                className="p-1 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title="Edit"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete();
                                }}
                                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title="Delete"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}
            </div>

            <MoveToBoardModal
                isOpen={isMoving}
                onClose={() => setIsMoving(false)}
                currentBoardId={task.boardId}
                onConfirm={handleMoveConfirm}
            />

            <DependencyModal
                isOpen={showDependencyModal}
                onClose={() => setShowDependencyModal(false)}
                task={task}
            />

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Blocking Task</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            This task is blocking {dependentTasksCount} other task(s). Deleting it will remove the dependency constraint from those tasks.
                            <br /><br />
                            Are you sure you want to proceed?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition"
                            >
                                Delete Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
