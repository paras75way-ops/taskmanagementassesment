import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import TaskCard from "../kanban/TaskCard";
import type { LocalTask } from "../../types/task";

interface DayRowProps {
    id: string; // The targetDate (yyyy-MM-dd) or "backlog"
    title: string;
    subtitle?: string;
    isToday?: boolean;
    tasks: LocalTask[];
}

export default function DayRow({ id, title, subtitle, isToday, tasks }: DayRowProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className={`flex flex-col w-full rounded-2xl border
                    ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50' : 'bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'} 
                    p-4 transition-colors
                    ${isOver ? "ring-2 ring-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/40" : ""}`}
        >
            {/* Header Area */}
            <div className={`flex items-center justify-between mb-4 pb-2 border-b ${isToday ? 'border-indigo-200 dark:border-indigo-800/50' : 'border-gray-100 dark:border-gray-700/50'}`}>
                <div className="flex items-center gap-3">
                    <h2 className={`text-lg font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-100'}`}>
                        {title}
                    </h2>
                    {subtitle && (
                        <span className={`text-sm ${isToday ? 'text-indigo-500/80 dark:text-indigo-400/80' : 'text-gray-500 dark:text-gray-400'}`}>
                            {subtitle}
                        </span>
                    )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isToday ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </span>
            </div>

            {/* Droppable Horizontal Row */}
            <div
                ref={setNodeRef}
                className="flex-1 flex flex-row gap-4 overflow-x-auto min-h-[160px] pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 items-start"
            >
                <SortableContext
                    items={tasks.map((t) => t._id)}
                    strategy={horizontalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <div key={task._id} className="w-[300px] flex-shrink-0">
                            <TaskCard task={task} />
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <div className="h-full min-w-[200px] flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity whitespace-nowrap">
                            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Drop tasks here</p>
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
