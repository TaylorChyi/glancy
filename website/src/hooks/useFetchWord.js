import { useApi } from "@/hooks/useApi.js";
import { resolveWordLanguage, WORD_LANGUAGE_AUTO } from "@/utils";
import { DEFAULT_MODEL } from "@/config";

export function useFetchWord() {
  const api = useApi();
  const { fetchWord } = api.words;

  const fetchWordWithHandling = async ({
    user,
    term,
    model = DEFAULT_MODEL,
    language = WORD_LANGUAGE_AUTO,
  }) => {
    const resolvedLanguage = resolveWordLanguage(term, language);
    try {
      const data = await fetchWord({
        userId: user.id,
        term,
        language: resolvedLanguage,
        model,
        token: user.token,
      });
      return { data, error: null, language: resolvedLanguage };
    } catch (error) {
      return { data: null, error, language: resolvedLanguage };
    }
  };

  return { fetchWordWithHandling };
}
