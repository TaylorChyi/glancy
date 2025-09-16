import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "./AppContext.jsx";
import { createApi } from "@/api/index.js";
import { resetClientSessionState } from "@/session/sessionLifecycle.js";

// eslint-disable-next-line react-refresh/only-export-components
export const ApiContext = createContext(createApi());

export function ApiProvider({ children }) {
  const { user, clearUser } = useUser();
  const token = user?.token;
  const navigate = useNavigate();
  const hasHandledUnauthorizedRef = useRef(false);

  useEffect(() => {
    hasHandledUnauthorizedRef.current = false;
  }, [token]);

  const handleUnauthorized = useCallback(() => {
    if (hasHandledUnauthorizedRef.current) return;

    hasHandledUnauthorizedRef.current = true;
    resetClientSessionState();
    clearUser();

    if (typeof window !== "undefined") {
      try {
        window.localStorage.clear();
      } catch (error) {
        console.error("Failed to clear local storage during logout", error);
      }
    }

    navigate("/login", { replace: true });
  }, [clearUser, navigate]);

  const api = useMemo(
    () => createApi({ token, onUnauthorized: handleUnauthorized }),
    [token, handleUnauthorized],
  );
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApiContext = () => useContext(ApiContext);
