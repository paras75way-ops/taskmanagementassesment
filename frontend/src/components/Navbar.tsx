import { useNavigate } from "react-router";
import type { IUser } from "../types/auth";
import { logouts as logoutService } from "../services/auth.service";
import { logout as logoutAction } from "../store/slices/auth.slice";
import { useAppDispatch } from "../store/hooks";

interface NavbarProps {
    user: IUser;
}

export default function Navbar({ user }: NavbarProps) {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    function handleLogout() {
        logoutService();
        dispatch(logoutAction());
        navigate("/signin");
    }

    return (
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-10 w-full shadow-sm">
            <div className="flex items-center">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden sm:block">
                    Dashboard
                </h2>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-200 font-bold">
                        {user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:block">
                        {user.email}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}