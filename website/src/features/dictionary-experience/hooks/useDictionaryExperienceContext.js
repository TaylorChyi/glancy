/**
 * 背景：
 *  - 多个上下文（语言、主题、用户、历史、弹窗等）在主 Hook 中逐一初始化，造成噪音。
 * 目的：
 *  - 聚合基础上下文依赖，统一出口，便于后续模块按需解构使用。
 * 关键决策与取舍：
 *  - 不在此处理业务逻辑，仅收集上下文与语言配置；
 *  - 将 useDictionaryLanguageConfig 也纳入，保持语言能力集中。
 * 影响范围：
 *  - useDictionaryExperience 主 Hook 的依赖管理。
 * 演进与TODO：
 *  - 若未来上下文增多，可在此添加 memo 化或调试日志。
 */
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
