import { lazy } from "react";

export const ROUTES_BLUEPRINT = Object.freeze([
  {
    path: "/",
    component: lazy(() => import("@/pages/App")),
  },
  {
    path: "/gomemo",
    component: lazy(() => import("@/pages/Gomemo")),
  },
  {
    path: "/login",
    component: lazy(() => import("@/pages/auth/Login")),
  },
  {
    path: "/register",
    component: lazy(() => import("@/pages/auth/Register")),
  },
  {
    path: "*",
    component: lazy(() => import("@/components/FallbackRedirect.jsx")),
  },
]);

export default ROUTES_BLUEPRINT;
