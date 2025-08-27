import { createContext, useContext } from "react";
import { useFavoritesStore } from "@/store";

// eslint-disable-next-line react-refresh/only-export-components
export const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const store = useFavoritesStore();
  return (
    <FavoritesContext.Provider value={store}>
      {children}
    </FavoritesContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = () => useContext(FavoritesContext);
