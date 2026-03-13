import { Outlet, Link } from "react-router";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col dark
                    bg-gray-900 text-gray-100">

      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Public Layout
          </h2>

          <nav className="flex gap-4 text-sm font-medium">
            <Link
              to="/signin"
              className="text-gray-400 hover:text-white transition">
              Sign In
            </Link>

            <Link
              to="/signup"
              className="text-gray-400 hover:text-white transition"
            >
              Sign Up
            </Link>

            <Link
              to="/dashboard"
              className="text-gray-400 hover:text-white
                         transition"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <Outlet />
      </main>
    </div>
  );
}