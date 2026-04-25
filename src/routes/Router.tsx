import { createBrowserRouter, Navigate } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import Onboarding from "../pages/Onboarding";
import Dashboard from "../pages/Dashboard";
import PrescriptionDetails from "../pages/PrescriptionDetails";
import About from "../pages/About";

function hasExistingUser() {
  const uid = localStorage.getItem("rxreader_uid");
  const completed = localStorage.getItem("rxreader_onboarding_completed");

  return Boolean(uid) && completed === "true";
}

function OnboardingGuard() {
  if (hasExistingUser()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Onboarding />;
}

function DashboardGuard() {
  if (!hasExistingUser()) {
    return <Navigate to="/" replace />;
  }

  return <Dashboard />;
}

export const router: RouteObject[] = [
  {
    path: "/",
    element: <OnboardingGuard />,
  },
  {
    path: "dashboard",
    element: <DashboardGuard />,
  },
  {
    path: "about",
    element: <About />,
  },
  {
    path: "prescription/:id",
    element: <PrescriptionDetails />,
  },
];

export const appRouter = createBrowserRouter(router);