import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { formatDistanceToNow } from "date-fns";
import type { ActivityAction } from "../../types/task";
import {
    ClockIcon,
    XIcon,
    CreateActivityIcon,
    UpdateActivityIcon,
    MoveActivityIcon,
    DeleteActivityIcon,
    DependencyIcon,
    DependencyRemoveActivityIcon
} from "../../assets/icons";

const ACTION_ICONS: Record<ActivityAction, React.ReactNode> = {
    create: <CreateActivityIcon className="w-5 h-5 text-green-500" />,
    update: <UpdateActivityIcon className="w-5 h-5 text-blue-500" />,
    move: <MoveActivityIcon className="w-5 h-5 text-purple-500" />,
    delete: <DeleteActivityIcon className="w-5 h-5 text-red-500" />,
    dependency_add: <DependencyIcon className="w-5 h-5 text-orange-500" />,
    dependency_remove: <DependencyRemoveActivityIcon className="w-5 h-5 text-gray-500" />,
};

interface ActivityLogPanelProps {
    boardId: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ActivityLogPanel({ boardId, isOpen, onClose }: ActivityLogPanelProps) {
    const activities = useLiveQuery(
        () => db.activities
            .where('boardId').equals(boardId)
            .reverse()
            .sortBy('createdAt'),
        [boardId]
    ) ?? [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    Activity Log
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <XIcon className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {activities.length === 0 ? (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                        No recent activity
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id ?? activity._id} className="relative flex gap-4">
                            <div className="absolute top-8 left-2 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 ring-8 ring-white dark:ring-gray-800">
                                {ACTION_ICONS[activity.action]}
                            </div>
                            <div className="min-w-0 flex-1 py-1">
                                <p className="text-sm text-gray-800 dark:text-gray-200">
                                    {activity.description}
                                </p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {activity.createdAt ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) : 'Just now'}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
