import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";
import Onboarding from "../pages/Onboarding";

export const router: RouteObject[] = [
  {
    path: "/",
    element: <Onboarding />,
  },
];

export const appRouter = createBrowserRouter(router);