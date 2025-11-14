import { useMemo } from "react";
import { useApi } from "@shared/hooks/useApi.js";
import {
  resolveWordLanguage,
  WORD_LANGUAGE_AUTO,
  WORD_FLAVOR_BILINGUAL,
} from "@shared/utils";
import { DEFAULT_MODEL } from "@core/config";

function createFetchWordParams({
  user,
  term,
  model = DEFAULT_MODEL,
  language = WORD_LANGUAGE_AUTO,
  flavor = WORD_FLAVOR_BILINGUAL,
  forceNew = false,
  versionId,
  captureHistory,
}) {
  const resolvedLanguage = resolveWordLanguage(term, language);
  const resolvedFlavor = flavor ?? WORD_FLAVOR_BILINGUAL;

  return {
    request: {
      userId: user.id,
      term,
      language: resolvedLanguage,
      flavor: resolvedFlavor,
      model,
      token: user.token,
      forceNew,
      versionId,
      captureHistory,
    },
    meta: {
      language: resolvedLanguage,
      flavor: resolvedFlavor,
    },
  };
}

function mapWordSuccess(data, meta) {
  return { data, error: null, ...meta };
}

function mapWordFailure(error, meta) {
  return { data: null, error, ...meta };
}

export function useFetchWord() {
  const api = useApi();
  const { fetchWord } = api.words;

  const fetchWordWithHandling = useMemo(
    () =>
      async (options) => {
        const { request, meta } = createFetchWordParams(options);

        try {
          const data = await fetchWord(request);
          return mapWordSuccess(data, meta);
        } catch (error) {
          return mapWordFailure(error, meta);
        }
      },
    [fetchWord],
  );

  return { fetchWordWithHandling };
}
