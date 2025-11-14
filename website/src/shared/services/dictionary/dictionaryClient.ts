import { useMemo } from "react";
import { DEFAULT_MODEL } from "@core/config";
import { useApi } from "@shared/hooks/useApi.js";
import {
  WORD_LANGUAGE_AUTO,
  WORD_FLAVOR_BILINGUAL,
  WORD_DEFAULT_TARGET_LANGUAGE,
  resolveDictionaryConfig,
} from "@shared/utils/language.js";
import {
  DictionaryEntryResponse,
  DictionaryServiceError,
  mapDictionaryEntryResponse,
  mapDictionaryError,
  mapDictionaryExamples,
} from "./dictionaryMappers";

type WordsApi = {
  fetchWord: (options: Record<string, unknown>) => Promise<unknown>;
};

export interface DictionaryEntryCommand {
  term: string;
  userId: string;
  token?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  flavor?: string;
  model?: string;
  forceNew?: boolean;
  versionId?: string | null;
  captureHistory?: boolean;
}

export interface DictionaryClient {
  loadEntry: (
    command: DictionaryEntryCommand,
  ) => Promise<DictionaryEntryResponse>;
  fetchExamples: (
    command: DictionaryEntryCommand,
  ) => Promise<{ examples: string[]; error: DictionaryServiceError | null }>;
}

const sanitizeTerm = (term: string): string => term?.trim() ?? "";

const hasLookupPrerequisites = (command: DictionaryEntryCommand): boolean =>
  Boolean(command?.userId) && Boolean(sanitizeTerm(command.term));

const handleMissingPrerequisites = (
  command: DictionaryEntryCommand,
): DictionaryEntryResponse | null => {
  if (hasLookupPrerequisites(command)) {
    return null;
  }

  return mapDictionaryEntryResponse({
    data: null,
    language: "ENGLISH",
    flavor: WORD_FLAVOR_BILINGUAL,
  });
};

const resolveLookupConfig = (command: DictionaryEntryCommand) => {
  const term = sanitizeTerm(command.term);
  const sourceLanguage = command.sourceLanguage ?? WORD_LANGUAGE_AUTO;
  const targetLanguage =
    command.targetLanguage ?? WORD_DEFAULT_TARGET_LANGUAGE;
  const { language, flavor } = resolveDictionaryConfig(term, {
    sourceLanguage,
    targetLanguage,
  });
  return {
    term,
    language,
    flavor: command.flavor ?? flavor ?? WORD_FLAVOR_BILINGUAL,
  };
};

const buildRequest = (
  command: DictionaryEntryCommand,
  config: ReturnType<typeof resolveLookupConfig>,
) => ({
  userId: command.userId,
  term: config.term,
  language: config.language,
  flavor: config.flavor,
  model: command.model ?? DEFAULT_MODEL,
  token: command.token,
  forceNew: Boolean(command.forceNew),
  versionId: command.versionId ?? undefined,
  captureHistory:
    command.captureHistory === undefined
      ? undefined
      : Boolean(command.captureHistory),
});

const createErrorResponse = ({
  error,
  language,
  flavor,
}: {
  error: unknown;
  language: string;
  flavor: string;
}): DictionaryEntryResponse => ({
  data: null,
  error: mapDictionaryError(error),
  language,
  flavor,
});

const fetchDictionaryEntry = (
  wordsApi: WordsApi,
  command: DictionaryEntryCommand,
  config: ReturnType<typeof resolveLookupConfig>,
): Promise<unknown> => wordsApi.fetchWord(buildRequest(command, config));

const buildDictionarySuccess = (
  data: unknown,
  config: ReturnType<typeof resolveLookupConfig>,
): DictionaryEntryResponse =>
  mapDictionaryEntryResponse({
    data,
    language: config.language,
    flavor: config.flavor,
  });

export const createDictionaryClient = (wordsApi: WordsApi): DictionaryClient => {
  const loadEntry = async (
    command: DictionaryEntryCommand,
  ): Promise<DictionaryEntryResponse> => {
    const missingPrerequisitesResponse = handleMissingPrerequisites(command);
    if (missingPrerequisitesResponse) {
      return missingPrerequisitesResponse;
    }

    const config = resolveLookupConfig(command);
    try {
      const data = await fetchDictionaryEntry(wordsApi, command, config);
      return buildDictionarySuccess(data, config);
    } catch (error) {
      return createErrorResponse({
        error,
        language: config.language,
        flavor: config.flavor,
      });
    }
  };

  const fetchExamples = async (
    command: DictionaryEntryCommand,
  ): Promise<{ examples: string[]; error: DictionaryServiceError | null }> => {
    const result = await loadEntry({ ...command, forceNew: false });
    if (result.error) {
      return { examples: [], error: result.error };
    }
    return {
      examples: mapDictionaryExamples(result.data),
      error: null,
    };
  };

  return { loadEntry, fetchExamples };
};

export const useDictionaryClient = (): DictionaryClient => {
  const api = useApi();
  return useMemo(
    () => createDictionaryClient(api.words),
    [api.words],
  );
};
