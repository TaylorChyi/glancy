import { useNavigate } from "react-router-dom";
import {
  useHistory,
  useUser,
  useFavorites,
  useTheme,
  useLanguage,
} from "@core/context";
import { useDictionaryToast } from "./useDictionaryToast.js";
import { useDictionaryLanguageConfig } from "./useDictionaryLanguageConfig.js";
import { useMessagePopup } from "@shared/hooks/useMessagePopup.js";

export function useDictionaryExperienceContext() {
  const navigate = useNavigate();
  const languageContext = useLanguage();
  const themeContext = useTheme();
  const userContext = useUser();
  const favoritesContext = useFavorites();
  const historyContext = useHistory();
  const popup = useMessagePopup();
  const toast = useDictionaryToast();
  const languageConfig = useDictionaryLanguageConfig({
    t: languageContext.t,
  });

  return {
    navigate,
    languageContext,
    themeContext,
    userContext,
    favoritesContext,
    historyContext,
    popup,
    toast,
    languageConfig,
  };
}
