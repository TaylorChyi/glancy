import { lazy } from "react";

export const ROUTES_BLUEPRINT = Object.freeze([
  {
    path: "/",
    component: lazy(() => import("@app/pages/App")),
  },
  {
    path: "/login",
    component: lazy(() => import("@app/pages/auth/Login")),
  },
  {
    path: "/register",
    component: lazy(() => import("@app/pages/auth/Register")),
  },
  {
    path: "*",
    component: lazy(() => import("@shared/components/FallbackRedirect.jsx")),
  },
]);

export default ROUTES_BLUEPRINT;
