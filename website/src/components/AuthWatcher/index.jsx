import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context";

const PUBLIC_ROUTES = ["/login", "/register"];

function AuthWatcher() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
      navigate("/login", { replace: true });
      return;
    }

    if (user && isPublicRoute) {
      navigate("/", { replace: true });
    }
  }, [user, pathname, navigate]);

  return null;
}

export default AuthWatcher;
