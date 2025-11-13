import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@core/context";
import { useCookieConsentStore } from "@core/store";

const PUBLIC_ROUTES = ["/login", "/register"];

const useCookieGate = () =>
  useCookieConsentStore((state) => ({
    hasLoginCookie: state.hasLoginCookie,
    requireCookieAccess: state.requireCookieAccess,
    synchronizeLoginCookie: state.synchronizeLoginCookie,
  }));

const resolveRedirectTarget = ({
  user,
  pathname,
  hasLoginCookie,
  requireCookieAccess,
  synchronizeLoginCookie,
}) => {
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!user && !isPublicRoute) {
    const shouldRedirectToLogin =
      (requireCookieAccess() && synchronizeLoginCookie()) || hasLoginCookie;
    return shouldRedirectToLogin ? "/login" : "/register";
  }

  if (user && isPublicRoute) {
    return "/";
  }

  return null;
};

function AuthWatcher() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { hasLoginCookie, requireCookieAccess, synchronizeLoginCookie } =
    useCookieGate();

  useEffect(() => {
    const target = resolveRedirectTarget({
      user,
      pathname,
      hasLoginCookie,
      requireCookieAccess,
      synchronizeLoginCookie,
    });
    if (target) navigate(target, { replace: true });
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
