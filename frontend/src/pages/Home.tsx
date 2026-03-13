import { Link } from "react-router";

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                    <span className="block xl:inline">Taking control of your </span>
                    <span className="block text-indigo-400 xl:inline">tasks and time</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-2xl">
                    A powerful, offline-first Kanban board that seamlessly syncs your data when you are back online. Never lose track of your progress again.
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                    <div className="rounded-md shadow">
                        <Link
                            to="/signup"
                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 transition-colors md:py-4 md:text-lg md:px-10"
                        >
                            Get Started
                        </Link>
                    </div>
                    <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                        <Link
                            to="/signin"
                            className="w-full flex items-center justify-center px-8 py-3 border border-gray-700 text-base font-medium rounded-md text-indigo-400 bg-gray-800 hover:bg-gray-700 transition-colors md:py-4 md:text-lg md:px-10"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mt-16 sm:mx-auto sm:w-full sm:max-w-5xl">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Feature 1 */}
                    <div className="pt-6">
                        <div className="flow-root bg-gray-800 border border-gray-700 rounded-lg px-6 pb-8 shadow-sm h-full hover:border-indigo-500/50 transition-colors">
                            <div className="-mt-6">
                                <div>
                                    <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </span>
                                </div>
                                <h3 className="mt-8 text-lg font-medium text-gray-100 tracking-tight">Offline First</h3>
                                <p className="mt-5 text-base text-gray-400">
                                    Keep working even when your internet drops. All changes are saved locally and synced automatically when you're back online.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="pt-6">
                        <div className="flow-root bg-gray-800 border border-gray-700 rounded-lg px-6 pb-8 shadow-sm h-full hover:border-indigo-500/50 transition-colors">
                            <div className="-mt-6">
                                <div>
                                    <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </span>
                                </div>
                                <h3 className="mt-8 text-lg font-medium text-gray-100 tracking-tight">Analytics</h3>
                                <p className="mt-5 text-base text-gray-400">
                                    Visualize your progress with real-time pie charts. Know exactly how many tasks are completed versus pending.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="pt-6">
                        <div className="flow-root bg-gray-800 border border-gray-700 rounded-lg px-6 pb-8 shadow-sm h-full hover:border-indigo-500/50 transition-colors">
                            <div className="-mt-6">
                                <div>
                                    <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg">
                                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </span>
                                </div>
                                <h3 className="mt-8 text-lg font-medium text-gray-100 tracking-tight">Secure</h3>
                                <p className="mt-5 text-base text-gray-400">
                                    Full authentication with JWT access and refresh tokens stored securely in HttpOnly cookies, protecting your data.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}