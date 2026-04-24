import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import Onboarding from "../pages/Onboarding";
import Dashboard from "../pages/Dashboard";
import PrescriptionDetails from "../pages/PrescriptionDetails";
import About from "../pages/About";

export const router: RouteObject[] = [
  {
    path: "/",
    element: <Onboarding />,
  },
  {
    path: "dashboard",
    element: <Dashboard />,
  },
  {
    path: "about",
    element: <About />,
  },
  {
    path: "prescription/:id",
    element: <PrescriptionDetails />,
  }

];

export const appRouter = createBrowserRouter(router);