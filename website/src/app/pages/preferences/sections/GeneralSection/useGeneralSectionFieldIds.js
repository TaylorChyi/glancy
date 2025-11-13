import { useId, useMemo } from "react";

export const useGeneralSectionFieldIds = () => {
  const themeId = useId();
  const languageId = useId();
  const markdownId = useId();

  return useMemo(
    () => ({
      theme: themeId,
      language: languageId,
      markdown: markdownId,
    }),
    [languageId, markdownId, themeId],
  );
};

export default useGeneralSectionFieldIds;
