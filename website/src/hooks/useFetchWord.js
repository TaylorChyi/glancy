import { useApi } from "@/hooks/useApi.js";
import { detectWordLanguage } from "@/utils";

export function useFetchWord() {
  const api = useApi();
  const { fetchWord } = api.words;

  const fetchWordWithHandling = async ({ user, term, model = "DOUBAO" }) => {
    const language = detectWordLanguage(term);
    try {
      const data = await fetchWord({
        userId: user.id,
        term,
        language,
        model,
        token: user.token,
      });
      return { data, error: null, language };
    } catch (error) {
      return { data: null, error, language };
    }
  };

  return { fetchWordWithHandling };
}
