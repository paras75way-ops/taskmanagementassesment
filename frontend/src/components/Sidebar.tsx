import { NavLink } from "react-router";
import { DashboardIcon, CalendarIcon, ChartPieIcon, LockIcon } from "../assets/icons";

export default function Sidebar() {
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-600 dark:text-white"
            : "text-gray-700 hover:bg-gray-100 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
        }`;

    return (
        <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full flex-shrink-0 sticky top-0">
            <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                    MyApp
                </span>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                <NavLink to="/dashboard" className={linkClass}>
                    <DashboardIcon className="w-5 h-5 mr-3" />
                    Dashboard
                </NavLink>
                <NavLink to="/planner" className={linkClass}>
                    <CalendarIcon className="w-5 h-5 mr-3" />
                    Weekly Planner
                </NavLink>
                <NavLink to="/analytics" className={linkClass}>
                    <ChartPieIcon className="w-5 h-5 mr-3" />
                    View Analytics
                </NavLink>
                <NavLink to="/change-password" className={linkClass}>
                    <LockIcon className="w-5 h-5 mr-3" />
                    Change Password
                </NavLink>
            </nav>
        </aside>
    );
}
