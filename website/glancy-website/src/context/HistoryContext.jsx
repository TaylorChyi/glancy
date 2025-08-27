import { createContext, useContext } from "react";
import { useHistoryStore } from "@/store";

// eslint-disable-next-line react-refresh/only-export-components
export const HistoryContext = createContext(null);

export function HistoryProvider({ children }) {
  const store = useHistoryStore();
  return (
    <HistoryContext.Provider value={store}>{children}</HistoryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useHistory = () => useContext(HistoryContext);
