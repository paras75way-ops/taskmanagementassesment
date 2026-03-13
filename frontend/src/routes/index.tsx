import { createBrowserRouter } from "react-router";
import { lazy, Suspense } from "react";

import PublicLayout from "../layouts/Publiclayout";
import PrivateLayout from "../layouts/Privatelayout";

import { requireGuest, userLoader } from "./loader";
import { signInAction } from "./actions/signin.action";
import { signUpAction } from "./actions/signup.action";

import { LoadingFallback } from "../components/loadingfallback";

const Home = lazy(() => import("../pages/Home"));
const SignIn = lazy(() => import("../pages/Signin"));
const SignUp = lazy(() => import("../pages/Signup"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const WeeklyPlanner = lazy(() => import("../pages/WeeklyPlanner"));
const ChangePassword = lazy(() => import("../pages/Changepassword"));
const Analytics = lazy(() => import("../pages/Analytics"));
const VerifyEmail = lazy(() => import("../pages/VerifyEmail"));

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/verify-otp",
    element: withSuspense(VerifyEmail),
  },
  {
    element: <PublicLayout />,
    loader: requireGuest,
    HydrateFallback: LoadingFallback,
    children: [
      { path: "/", element: withSuspense(Home) },
      { path: "/signin", element: withSuspense(SignIn), action: signInAction },
      { path: "/signup", element: withSuspense(SignUp), action: signUpAction },
    ],
  },
  {
    id: "private-layout",
    element: <PrivateLayout />,
    loader: userLoader,
    HydrateFallback: LoadingFallback,
    children: [
      { path: "/dashboard", element: withSuspense(Dashboard) },
      { path: "/planner", element: withSuspense(WeeklyPlanner) },
      { path: "/analytics", element: withSuspense(Analytics) },
      { path: "/change-password", element: withSuspense(ChangePassword) },
    ],
  },
]);