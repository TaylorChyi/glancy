import { useLanguage, useTheme } from "@core/context";
import { useSettingsStore } from "@core/store/settings";

export const useGeneralSectionSettings = () => {
  const { theme, setTheme } = useTheme();
  const { t: translations, systemLanguage, setSystemLanguage } = useLanguage();
  const { markdownRenderingMode: markdownMode, setMarkdownRenderingMode } =
    useSettingsStore((state) => ({
      markdownRenderingMode: state.markdownRenderingMode,
      setMarkdownRenderingMode: state.setMarkdownRenderingMode,
    }));

  return {
    theme,
    setTheme,
    systemLanguage,
    setSystemLanguage,
    markdownMode,
    setMarkdownMode: setMarkdownRenderingMode,
    translations,
  };
};

export default useGeneralSectionSettings;
