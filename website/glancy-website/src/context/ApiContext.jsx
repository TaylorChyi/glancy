import { createContext, useContext, useMemo } from "react";
import { useUser } from "./UserContext.jsx";
import { createApi } from "@/api/index.js";

// eslint-disable-next-line react-refresh/only-export-components
export const ApiContext = createContext(createApi());

export function ApiProvider({ children }) {
  const { user, clearUser } = useUser();
  const token = user?.token;
  const api = useMemo(
    () => createApi({ token, onUnauthorized: clearUser }),
    [token, clearUser],
  );
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useApiContext = () => useContext(ApiContext);
