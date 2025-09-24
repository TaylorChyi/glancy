import { createContext, useContext } from "react";
import { useUserStore, useHistoryStore, useFavoritesStore } from "@/store";

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext({
  user: null,
  history: null,
  favorites: null,
});

export function AppProvider({ children }) {
  const user = useUserStore();
  const history = useHistoryStore();
  const favorites = useFavoritesStore();

  return (
    <AppContext.Provider value={{ user, history, favorites }}>
      {children}
    </AppContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => useContext(AppContext).user;
// eslint-disable-next-line react-refresh/only-export-components
export const useHistory = () => useContext(AppContext).history;
// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => useContext(AppContext).favorites;
