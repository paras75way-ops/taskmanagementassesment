import { Outlet, useLoaderData } from "react-router";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import type { IUser } from "../types/auth";

import SyncProvider from "../providers/SyncProvider";

export default function PrivateLayout() {
  const user = useLoaderData() as IUser;

  return (
    <SyncProvider user={user}>
      <div
        className="flex h-screen w-screen overflow-hidden font-sans
                      bg-gray-50 text-gray-900
                      dark:bg-gray-900 dark:text-gray-100"
      >
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Navbar user={user} />
          <main
            className="flex-1 overflow-auto p-6
                           bg-gray-50
                           dark:bg-gray-900"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </SyncProvider>
  );
}
