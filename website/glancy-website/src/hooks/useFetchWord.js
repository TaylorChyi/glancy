import { useApi } from "@/hooks/useApi.js";
import { detectWordLanguage, clientNameFromModel } from "@/utils";

export function useFetchWord() {
  const api = useApi();
  const { fetchWord } = api.words;

  const fetchWordWithHandling = async ({ user, term, model }) => {
    const language = detectWordLanguage(term);
    try {
      const data = await fetchWord({
        userId: user.id,
        term,
        language,
        model: clientNameFromModel(model),
        token: user.token,
      });
      return { data, error: null, language };
    } catch (error) {
      return { data: null, error, language };
    }
  };

  return { fetchWordWithHandling };
}

export function useStreamWord() {
  const api = useApi();
  const { streamWordWithHandling } = api.words;

  return async function* ({ user, term, model, signal }) {
    const language = detectWordLanguage(term);
    for await (const chunk of streamWordWithHandling({
      userId: user.id,
      term,
      language,
      model: clientNameFromModel(model),
      token: user.token,
      signal,
    })) {
      yield { chunk, language };
    }
  };
}
