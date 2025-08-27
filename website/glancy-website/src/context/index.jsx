/* eslint-disable react-refresh/only-export-components */
export * from "./LocaleContext.jsx";
export * from "./LanguageContext.jsx";
export * from "./ThemeContext.jsx";
export * from "./ApiContext.jsx";
/* eslint-enable react-refresh/only-export-components */

import { UserProvider } from "./UserContext.jsx";
import { HistoryProvider } from "./HistoryContext.jsx";
import { FavoritesProvider } from "./FavoritesContext.jsx";

export function AppProviders({ children }) {
  return (
    <UserProvider>
      <HistoryProvider>
        <FavoritesProvider>{children}</FavoritesProvider>
      </HistoryProvider>
    </UserProvider>
  );
}
