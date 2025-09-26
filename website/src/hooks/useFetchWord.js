import { useApi } from "@/hooks/useApi.js";
import {
  resolveWordLanguage,
  WORD_LANGUAGE_AUTO,
  WORD_FLAVOR_BILINGUAL,
} from "@/utils";
import { DEFAULT_MODEL } from "@/config";

export function useFetchWord() {
  const api = useApi();
  const { fetchWord } = api.words;

  const fetchWordWithHandling = async ({
    user,
    term,
    model = DEFAULT_MODEL,
    language = WORD_LANGUAGE_AUTO,
    flavor = WORD_FLAVOR_BILINGUAL,
  }) => {
    const resolvedLanguage = resolveWordLanguage(term, language);
    const resolvedFlavor = flavor ?? WORD_FLAVOR_BILINGUAL;
    try {
      const data = await fetchWord({
        userId: user.id,
        term,
        language: resolvedLanguage,
        flavor: resolvedFlavor,
        model,
        token: user.token,
      });
      return {
        data,
        error: null,
        language: resolvedLanguage,
        flavor: resolvedFlavor,
      };
    } catch (error) {
      return {
        data: null,
        error,
        language: resolvedLanguage,
        flavor: resolvedFlavor,
      };
    }
  };

  return { fetchWordWithHandling };
}
