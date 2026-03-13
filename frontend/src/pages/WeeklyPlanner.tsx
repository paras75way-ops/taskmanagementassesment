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
import { startOfWeek, addDays, format, parseISO } from "date-fns";

import { db } from "../lib/db";
import DayRow from "../components/planner/DayRow";
import TaskCard from "../components/kanban/TaskCard";
import CreateTaskModal from "../components/kanban/CreateTaskModal";
import SyncIndicator from "../components/kanban/SyncIndicator";
import ConflictHandling from "../components/kanban/ConflictHandling";
import { useTheme } from "../hooks/useTheme";
import type { LocalTask } from "../types/task";
import { queueTaskUpdate } from "../lib/taskMutations";
import { MoonIcon, SunIcon, PlusIcon } from "../assets/icons";

interface WeeklyPlannerProps {
    boardId: string;
}

export default function WeeklyPlanner() {
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
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

    if (!activeBoardId) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500">
                <p className="text-lg">You don't have any boards yet. Create one in the Dashboard.</p>
            </div>
        );
    }

    return <WeeklyPlannerContent boardId={activeBoardId} />;
}

function WeeklyPlannerContent({ boardId }: WeeklyPlannerProps) {
    const { theme, toggleTheme } = useTheme();

    const tasks = useLiveQuery(
        () => db.tasks.filter((t) => t.boardId === boardId && t.syncStatus !== "deleted").toArray(),
        [boardId]
    ) ?? [];

    const [activeTask, setActiveTask] = useState<LocalTask | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const weekDays = useMemo(() => {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        return Array.from({ length: 7 }).map((_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
    }, []);

    const COLUMNS = useMemo(() => ["backlog", ...weekDays], [weekDays]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const tasksByColumn = useMemo(() => {
        const grouped: Record<string, LocalTask[]> = {
            backlog: [],
        };

        for (const date of weekDays) {
            grouped[date] = [];
        }

        for (const task of tasks) {
            if (task.targetDate && grouped[task.targetDate]) {
                grouped[task.targetDate].push(task);
            } else if (task.status === "todo" && !task.targetDate) {
                grouped.backlog.push(task);
            }
        }

        for (const key of Object.keys(grouped)) {
            grouped[key].sort((a, b) => a.position - b.position);
        }
        return grouped;
    }, [tasks, weekDays]);

    const findColumnOfTask = (taskId: string): string | null => {
        for (const col of Object.keys(tasksByColumn)) {
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

    const handleDragOver = (_event: DragOverEvent) => { };

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeCol = findColumnOfTask(activeId);
        let overCol: string | null = null;

        if (COLUMNS.includes(overId)) {
            overCol = overId;
        } else {
            overCol = findColumnOfTask(overId);
        }

        if (!activeCol || !overCol) return;

        const draggedTask = tasksByColumn[activeCol].find((t) => t._id === activeId);
        if (!draggedTask) return;

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
            if (!COLUMNS.includes(overId)) {
                const overIndex = targetTasks.findIndex((t) => t._id === overId);
                if (overIndex !== -1) insertIndex = overIndex;
            }

            const isGoingToBacklog = overCol === "backlog";
            const newTargetDate = isGoingToBacklog ? undefined : overCol;
            const newStatus = isGoingToBacklog ? "todo" : draggedTask.status;

            await queueTaskUpdate(activeId, {
                targetDate: newTargetDate,
                status: newStatus,
                position: insertIndex
            });

            const updatedTargetTasks = [
                ...targetTasks.slice(0, insertIndex),
                { ...draggedTask, targetDate: newTargetDate, status: newStatus },
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
        <div className="h-full flex flex-col px-4 pt-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Weekly Planner
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
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pb-6 pr-2">

                    <DayRow
                        id="backlog"
                        title="Backlog"
                        tasks={tasksByColumn.backlog}
                    />


                    {weekDays.map((dateString) => {
                        const dateObj = parseISO(dateString);
                        const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;
                        return (
                            <DayRow
                                key={dateString}
                                id={dateString}
                                title={format(dateObj, 'EEEE')}
                                subtitle={format(dateObj, 'MMM d')}
                                isToday={isToday}
                                tasks={tasksByColumn[dateString]}
                            />
                        );
                    })}
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
