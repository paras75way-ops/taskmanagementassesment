import { useState, useMemo } from "react";
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

import { db } from "../../lib/db";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import CreateTaskModal from "./CreateTaskModal";
import SyncIndicator from "./SyncIndicator";
import ConflictHandling from "./ConflictHandling";
import { useTheme } from "../../hooks/useTheme";
import type { TaskStatus, LocalTask } from "../../types/task";
import { queueTaskUpdate, queueRemoveDependency } from "../../lib/taskMutations";

const COLUMNS: TaskStatus[] = ["todo", "inprogress", "done"];

interface KanbanBoardProps {
    boardId: string;
}

export default function KanbanBoard({ boardId }: KanbanBoardProps) {
    const { theme, toggleTheme } = useTheme();
    const tasks = useLiveQuery(
        () => db.tasks.filter((t) => t.boardId === boardId && t.syncStatus !== "deleted").toArray(),
        [boardId]
    ) ?? [];

    const [activeTask, setActiveTask] = useState<LocalTask | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

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
                alert("Cannot move a blocked task to 'done'. Please resolve its dependencies first.");
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                     bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm
                     hover:shadow-md transition-all duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
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

            <ConflictHandling />
        </div>
    );
}
