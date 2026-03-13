import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import BoardSelector from "../components/board/BoardSelector";

const COLORS = {
    pending: "#6366f1",
    complete: "#22c55e",
};

export default function Analytics() {
    const [selectedBoardId, setSelectedBoardId] = useState<string>("all");

    const tasks = useLiveQuery(
        () => {
            let collection = db.tasks.filter((t) => t.syncStatus !== "deleted");
            if (selectedBoardId !== "all") {
                collection = collection.and((t) => t.boardId === selectedBoardId);
            }
            return collection.toArray();
        },
        [selectedBoardId]
    ) ?? [];

    const chartData = useMemo(() => {
        let complete = 0;
        let pending = 0;

        for (const task of tasks) {
            if (task.status === "done") complete++;
            else pending++;
        }

        return [
            { name: "Complete", value: complete, color: COLORS.complete },
            { name: "Pending", value: pending, color: COLORS.pending },
        ];
    }, [tasks]);

    return (
        <div className="h-full flex flex-col max-w-7xl mx-auto w-full">
            <div className="mb-6 flex flex-col justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Real-time overview of your tasks.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Board Filter:</span>
                    <BoardSelector
                        value={selectedBoardId === "all" ? null : selectedBoardId}
                        onChange={(val) => setSelectedBoardId(val || "all")}
                        placeholder="All Boards"
                        className="w-48"
                    />
                    {selectedBoardId !== "all" && (
                        <button 
                            onClick={() => setSelectedBoardId("all")}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex-1 min-h-[400px] flex flex-col">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Task Completion Status
                </h2>

                <div className="flex-1 w-full relative">
                    {tasks.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="transparent"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'var(--color-bg-white, #fff)',
                                    }}
                                    itemStyle={{ color: '#111827', fontWeight: 500 }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <p>No tasks available to visualize.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
