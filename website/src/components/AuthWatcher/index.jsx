import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context";
import { useCookieConsentStore } from "@/store";

const PUBLIC_ROUTES = ["/login", "/register"];

function AuthWatcher() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const requireCookieAccess = useCookieConsentStore(
    (state) => state.requireCookieAccess,
  );
  const synchronizeLoginCookie = useCookieConsentStore(
    (state) => state.synchronizeLoginCookie,
  );
  const hasLoginCookie = useCookieConsentStore((state) => state.hasLoginCookie);

  useEffect(() => {
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isPublicRoute) {
      let shouldRedirectToLogin = false;
      if (requireCookieAccess()) {
        shouldRedirectToLogin = synchronizeLoginCookie();
      } else {
        shouldRedirectToLogin = false;
      }
      if (shouldRedirectToLogin || hasLoginCookie) {
        navigate("/login", { replace: true });
      } else {
        navigate("/register", { replace: true });
      }
      return;
    }

    if (user && isPublicRoute) {
      navigate("/", { replace: true });
    }
  }, [
    user,
    pathname,
    navigate,
    hasLoginCookie,
    requireCookieAccess,
    synchronizeLoginCookie,
  ]);

  return null;
}

export default AuthWatcher;
