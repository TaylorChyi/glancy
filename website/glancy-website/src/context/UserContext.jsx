import { createContext, useContext } from "react";
import { useUserStore } from "@/store";

// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const store = useUserStore();
  return <UserContext.Provider value={store}>{children}</UserContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => useContext(UserContext);
