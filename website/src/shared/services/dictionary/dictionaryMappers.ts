import { WORD_FLAVOR_BILINGUAL } from "@shared/utils/language.js";

export type DictionaryEntryDto = Record<string, unknown> | null;

export interface DictionaryServiceError {
  code: string;
  message: string;
  cause?: unknown;
}

export interface DictionaryEntryResponse<T = DictionaryEntryDto> {
  data: T | null;
  error: DictionaryServiceError | null;
  language: string;
  flavor: string;
}

const DEFAULT_ERROR_MESSAGE = "词典请求失败";

export const mapDictionaryEntryResponse = <
  TEntry extends DictionaryEntryDto,
>(payload: {
  data: TEntry | null;
  language?: string;
  flavor?: string;
}): DictionaryEntryResponse<TEntry> => ({
  data: payload.data ?? null,
  error: null,
  language: payload.language ?? "ENGLISH",
  flavor: payload.flavor ?? WORD_FLAVOR_BILINGUAL,
});

export const mapDictionaryError = (
  error: unknown,
  fallbackMessage: string = DEFAULT_ERROR_MESSAGE,
): DictionaryServiceError => {
  const message =
    (typeof error === "object" && error && "message" in error
      ? String(error.message)
      : null) ?? fallbackMessage;
  const code =
    (typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "DICTIONARY_REQUEST_FAILED");
  return { code, message, cause: error };
};

export const mapDictionaryExamples = (
  entry: DictionaryEntryDto,
): string[] => {
  if (!entry || typeof entry !== "object") {
    return [];
  }
  if (Array.isArray(entry.examples)) {
    return entry.examples.filter((example) => typeof example === "string");
  }
  if (typeof entry.example === "string") {
    return [entry.example];
  }
  return [];
};
