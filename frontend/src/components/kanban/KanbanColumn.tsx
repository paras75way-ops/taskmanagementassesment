import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";
import type { LocalTask, TaskStatus } from "../../types/task";

 

const COLUMN_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string; accent: string }> = {
  todo: {
    label: "To Do",
    color: "text-slate-400",
    bg: "bg-slate-900/40",
    border: "border-slate-800",
    accent: "before:bg-slate-500", // Top indicator
  },
  inprogress: {
    label: "In Progress",
    color: "text-amber-400",
    bg: "bg-amber-950/10",
    border: "border-amber-500/20",
    accent: "before:bg-amber-500",
  },
  done: {
    label: "Done",
    color: "text-emerald-400",
    bg: "bg-emerald-950/10",
    border: "border-emerald-500/20",
    accent: "before:bg-emerald-500",
  },
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: LocalTask[];
}

export default function KanbanColumn({ status, tasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = COLUMN_CONFIG[status];

  const sortedTasks = [...tasks].sort((a, b) => a.position - b.position);
  const taskIds = sortedTasks.map((t) => t._id);

  return (
    <div
      className={`flex flex-col min-w-[300px] max-w-[360px] flex-1
      rounded-2xl border backdrop-blur-sm
      ${config.bg}
      border-gray-200 dark:border-gray-700
      shadow-sm hover:shadow-md
      transition-all duration-200
      ${
        isOver
          ? "ring-2 ring-indigo-400 ring-offset-2 dark:ring-offset-gray-900 scale-[1.01]"
          : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-semibold tracking-wide ${config.color}`}>
            {config.label}
          </h3>

          <span className="flex items-center justify-center w-6 h-6 text-[11px] font-semibold rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 shadow-sm">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className="flex-1 p-4 space-y-3 overflow-y-auto min-h-[140px]"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {sortedTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/40 dark:bg-gray-900/30">
            <p className="text-xs text-gray-400 dark:text-gray-500 tracking-wide">
              Drop tasks here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}