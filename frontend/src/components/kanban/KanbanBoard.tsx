import { useState, useMemo, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useLiveQuery } from "dexie-react-hooks";
import toast from "react-hot-toast";

import { db } from "../../lib/db";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import CreateTaskModal from "./CreateTaskModal";
import SyncIndicator from "./SyncIndicator";
import ConflictHandling from "./ConflictHandling";
import { useTheme } from "../../hooks/useTheme";
import type { TaskStatus, LocalTask } from "../../types/task";
import { queueTaskUpdate, queueRemoveDependency } from "../../lib/taskMutations";

import { UndoProvider, useUndo } from "../../lib/undoManager";
import ActivityLogPanel from "./ActivityLogPanel";
import { MoonIcon, SunIcon, UndoIcon, ClockIcon, PlusIcon } from "../../assets/icons";

const COLUMNS: TaskStatus[] = ["todo", "inprogress", "done"];

interface KanbanBoardProps {
    boardId: string;
}

export default function KanbanBoard({ boardId }: KanbanBoardProps) {
    return (
        <UndoProvider>
            <KanbanBoardInner boardId={boardId} />
        </UndoProvider>
    );
}

function KanbanBoardInner({ boardId }: KanbanBoardProps) {
    const { theme, toggleTheme } = useTheme();
    const tasks = useLiveQuery(
        () => db.tasks.filter((t) => t.boardId === boardId && t.syncStatus !== "deleted").toArray(),
        [boardId]
    ) ?? [];

    const [activeTask, setActiveTask] = useState<LocalTask | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showActivityLog, setShowActivityLog] = useState(false);

    const { popUndo, canUndo } = useUndo();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                popUndo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [popUndo]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const tasksByColumn = useMemo(() => {
        const grouped: Record<TaskStatus, LocalTask[]> = {
            todo: [],
            inprogress: [],
            done: [],
        };
        for (const task of tasks) {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        }
        for (const key of COLUMNS) {
            grouped[key].sort((a, b) => a.position - b.position);
        }
        return grouped;
    }, [tasks]);

    const findColumnOfTask = (taskId: string): TaskStatus | null => {
        for (const col of COLUMNS) {
            if (tasksByColumn[col].some((t) => t._id === taskId)) {
                return col;
            }
        }
        return null;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find((t) => t._id === event.active.id);
        if (task) setActiveTask(task);
    };

    const handleDragOver = (_event: DragOverEvent) => {
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeCol = findColumnOfTask(activeId);
        let overCol: TaskStatus | null = null;

        if (COLUMNS.includes(overId as TaskStatus)) {
            overCol = overId as TaskStatus;
        } else {
            overCol = findColumnOfTask(overId);
        }

        if (!activeCol || !overCol) return;

        const activeTask = tasksByColumn[activeCol].find((t) => t._id === activeId);
        if (!activeTask) return;

        if (overCol === "done" && activeCol !== "done" && activeTask.blockedBy?.length) {
            const blockers = await db.tasks.where('_id').anyOf(activeTask.blockedBy).toArray();
            const isBlocked = blockers.some((b) => b.status !== "done");
            if (isBlocked) {
                toast.error("Cannot move a blocked task to 'done'. Please resolve its dependencies first.");
                return;
            }
        }

        if (activeCol === overCol) {
            const colTasks = [...tasksByColumn[activeCol]];
            const oldIndex = colTasks.findIndex((t) => t._id === activeId);
            const newIndex = colTasks.findIndex((t) => t._id === overId);

            if (oldIndex === -1 || newIndex === -1) return;

            const reordered = arrayMove(colTasks, oldIndex, newIndex);

            for (let i = 0; i < reordered.length; i++) {
                if (reordered[i].position !== i) {
                    await queueTaskUpdate(reordered[i]._id, { position: i });
                }
            }
        } else {
            const targetTasks = [...tasksByColumn[overCol]];

            let insertIndex = targetTasks.length;
            if (!COLUMNS.includes(overId as TaskStatus)) {
                const overIndex = targetTasks.findIndex((t) => t._id === overId);
                if (overIndex !== -1) insertIndex = overIndex;
            }

            await queueTaskUpdate(activeId, { status: overCol, position: insertIndex });

            if (overCol === "done") {
                const allLocalTasks = await db.tasks.toArray();
                const dependentTasks = allLocalTasks.filter(t => t.blockedBy?.includes(activeId));
                for (const dt of dependentTasks) {
                    await queueRemoveDependency(dt._id, activeId);
                }
            }

            const updatedTargetTasks = [
                ...targetTasks.slice(0, insertIndex),
                { ...activeTask, status: overCol },
                ...targetTasks.slice(insertIndex),
            ];

            for (let i = 0; i < updatedTargetTasks.length; i++) {
                if (updatedTargetTasks[i]._id !== activeId && updatedTargetTasks[i].position !== i) {
                    await queueTaskUpdate(updatedTargetTasks[i]._id, { position: i });
                }
            }
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Kanban Board
                    </h1>
                    <SyncIndicator />
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {theme === 'light' ? (
                            <MoonIcon className="h-5 w-5" />
                        ) : (
                            <SunIcon className="h-5 w-5" />
                        )}
                    </button>

                    <button
                        onClick={() => popUndo()}
                        disabled={!canUndo}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${canUndo
                            ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                            : 'text-gray-400 bg-gray-50 dark:text-gray-600 dark:bg-gray-800 cursor-not-allowed'
                            }`}
                        title="Undo (Ctrl+Z)"
                    >
                        <UndoIcon className="w-4 h-4" />
                        Undo
                    </button>

                    <button
                        onClick={() => setShowActivityLog(true)}
                        className="p-2 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center gap-1 text-sm font-medium"
                        title="Activity Log"
                    >
                        <ClockIcon className="w-4 h-4" />
                        Log
                    </button>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                     bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm
                     hover:shadow-md transition-all duration-200"
                >
                    <PlusIcon className="w-4 h-4" />
                    Add Task
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 flex gap-5 overflow-x-auto pb-4">
                    {COLUMNS.map((status) => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            tasks={tasksByColumn[status]}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeTask ? (
                        <div className="rotate-3 opacity-90">
                            <TaskCard task={activeTask} />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <CreateTaskModal
                boardId={boardId}
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
            />

            <ActivityLogPanel
                boardId={boardId}
                isOpen={showActivityLog}
                onClose={() => setShowActivityLog(false)}
            />

            <ConflictHandling />
        </div>
    );
}
