import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/context";

const FALLBACK_ROUTES = Object.freeze({
  authenticated: "/",
  unauthenticated: "/login",
});

function FallbackRedirect() {
  const { user } = useUser();

  const targetPath = useMemo(
    () =>
      user ? FALLBACK_ROUTES.authenticated : FALLBACK_ROUTES.unauthenticated,
    [user],
  );

  return <Navigate to={targetPath} replace />;
}

export default FallbackRedirect;
