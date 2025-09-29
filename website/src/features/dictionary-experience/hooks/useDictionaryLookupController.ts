import { useCallback, useEffect, useState } from "react";
import type { MutableRefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useHistory, useUser } from "@/context";
import { useStreamWord } from "@/hooks";
import {
  extractMarkdownPreview,
  resolveDictionaryConfig,
  resolveDictionaryFlavor,
  WORD_LANGUAGE_AUTO,
} from "@/utils";
import { DEFAULT_MODEL } from "@/config";
import { wordCacheKey } from "@/api/words.js";
import { useWordStore } from "@/store";

export type LookupControllerParams = {
  abortRef: MutableRefObject<AbortController | null>;
  dictionarySourceLanguage: string | null;
  dictionaryTargetLanguage: string | null;
  dictionaryFlavor: string | null;
  onError: (message: string) => void;
};

export function useDictionaryLookupController({
  abortRef,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
  onError,
}: LookupControllerParams) {
  const [text, setText] = useState("");
  const [entry, setEntry] = useState<any>(null);
  const [finalText, setFinalText] = useState("");
  const [streamText, setStreamText] = useState("");
  const [versions, setVersions] = useState<any[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<
    string | number | null
  >(null);
  const [currentTermKey, setCurrentTermKey] = useState<string | null>(null);
  const [currentTerm, setCurrentTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user } = useUser();
  const {
    history: historyItems,
    loadHistory,
    addHistory,
    unfavoriteHistory,
    removeHistory,
  } = useHistory();
  const wordEntries = useWordStore((state) => state.entries);
  const wordStoreApi = useWordStore;
  const streamWord = useStreamWord();

  const applyRecord = useCallback(
    (
      termKey: string,
      record: any,
      preferredVersionId?: string | number | null,
    ) => {
      if (!termKey || !record || !Array.isArray(record.versions)) return false;
      if (record.versions.length === 0) {
        setVersions([]);
        setActiveVersionId(null);
        return false;
      }
      const fallbackId =
        record.versions[0]?.id ?? record.versions[0]?.versionId ?? null;
      const resolvedActiveId =
        preferredVersionId ?? record.activeVersionId ?? fallbackId;
      const resolvedEntry =
        wordStoreApi.getState().getEntry?.(termKey, resolvedActiveId) ??
        record.versions.find(
          (item: any) => String(item.id) === String(resolvedActiveId),
        ) ??
        record.versions[record.versions.length - 1];
      setVersions(record.versions);
      setActiveVersionId(resolvedActiveId ?? null);
      if (resolvedEntry) {
        setEntry(resolvedEntry);
        setFinalText(resolvedEntry.markdown ?? "");
        if (resolvedEntry.term) {
          setCurrentTerm(resolvedEntry.term);
        }
      }
      return !!resolvedEntry;
    },
    [wordStoreApi],
  );

  const executeLookup = useCallback(
    async (
      term: string,
      {
        forceNew = false,
        versionId,
        language: preferredLanguage,
        flavor: preferredFlavor,
      }: {
        forceNew?: boolean;
        versionId?: string | number | null;
        language?: string | null;
        flavor?: string | null;
      } = {},
    ) => {
      const normalized = term.trim();
      if (!normalized) {
        return { status: "idle" as const, term: normalized };
      }

      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      const { language: resolvedLanguage, flavor: defaultFlavor } =
        resolveDictionaryConfig(normalized, {
          sourceLanguage:
            preferredLanguage ?? dictionarySourceLanguage ?? WORD_LANGUAGE_AUTO,
          targetLanguage: dictionaryTargetLanguage,
        });
      const targetFlavor = preferredFlavor ?? defaultFlavor;
      const cacheKey = wordCacheKey({
        term: normalized,
        language: resolvedLanguage,
        flavor: targetFlavor,
        model: DEFAULT_MODEL,
      });
      const isNewTerm = currentTermKey !== cacheKey;
      const shouldResetView = isNewTerm || forceNew;
      setCurrentTermKey(cacheKey);
      setCurrentTerm(normalized);
      setStreamText("");
      if (shouldResetView) {
        setEntry(null);
        setFinalText("");
        setVersions([]);
        setActiveVersionId(null);
      }

      if (!forceNew && versionId) {
        const cachedRecord = wordStoreApi.getState().getRecord?.(cacheKey);
        if (cachedRecord) {
          const hydrated = applyRecord(cacheKey, cachedRecord, versionId);
          if (hydrated) {
            setLoading(false);
            abortRef.current = null;
            return {
              status: "success" as const,
              term: normalized,
              detectedLanguage: resolvedLanguage,
            };
          }
        }
      }

      let detected = resolvedLanguage;
      try {
        let acc = "";
        let preview = "";
        let parsedEntry: any = null;

        for await (const { chunk, language } of streamWord({
          user,
          term: normalized,
          signal: controller.signal,
          forceNew,
          versionId,
          language: resolvedLanguage,
          flavor: targetFlavor,
        })) {
          if (language && language !== detected) detected = language;
          acc += chunk;

          const derived = extractMarkdownPreview(acc);
          preview = derived === null ? preview : derived;
          setStreamText(preview);

          try {
            parsedEntry = JSON.parse(acc);
            setEntry(parsedEntry);
          } catch {
            // waiting for JSON to finish streaming
          }
        }

        const record = wordStoreApi.getState().getRecord?.(cacheKey);
        if (record) {
          applyRecord(cacheKey, record, record.activeVersionId);
        } else if (parsedEntry) {
          setEntry(parsedEntry);
          setFinalText(parsedEntry.markdown ?? "");
        } else {
          setFinalText(preview);
        }

        setCurrentTerm(normalized);
        return {
          status: "success" as const,
          term: normalized,
          detectedLanguage: detected ?? resolvedLanguage,
          flavor: targetFlavor,
        };
      } catch (error: any) {
        if (error?.name === "AbortError") {
          return { status: "cancelled" as const, term: normalized };
        }

        onError(error?.message ?? "Lookup failed");
        return { status: "error" as const, term: normalized, error };
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [
      abortRef,
      applyRecord,
      currentTermKey,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
      onError,
      streamWord,
      user,
      wordStoreApi,
    ],
  );

  const handleSend = useCallback(
    async (event: { preventDefault?: () => void }) => {
      event?.preventDefault?.();
      if (!user) {
        navigate("/login");
        return;
      }
      if (!text.trim()) return;

      const inputValue = text.trim();
      setText("");

      const result = await executeLookup(inputValue);
      if (result.status === "success") {
        addHistory(
          inputValue,
          user,
          result.detectedLanguage,
          result.flavor ?? dictionaryFlavor,
        );
      }
    },
    [user, navigate, text, executeLookup, addHistory, dictionaryFlavor],
  );

  const handleReoutput = useCallback(() => {
    if (!currentTerm) return;
    executeLookup(currentTerm, { forceNew: true });
  }, [currentTerm, executeLookup]);

  const handleNavigateVersion = useCallback(
    (direction: "next" | "prev") => {
      if (!currentTermKey || versions.length === 0) return;
      const currentIndex = versions.findIndex(
        (item) => String(item.id) === String(activeVersionId),
      );
      const safeIndex = currentIndex >= 0 ? currentIndex : versions.length - 1;
      const delta = direction === "next" ? 1 : -1;
      const nextIndex = Math.min(
        versions.length - 1,
        Math.max(0, safeIndex + delta),
      );
      if (nextIndex === safeIndex) return;
      const nextVersion = versions[nextIndex];
      if (!nextVersion) return;
      const nextId = nextVersion.id ?? nextVersion.versionId;
      wordStoreApi.getState().setActiveVersion?.(currentTermKey, nextId);
      setActiveVersionId(nextId ?? null);
      setEntry(nextVersion);
      setFinalText(nextVersion.markdown ?? "");
      setStreamText("");
      if (nextVersion.term) {
        setCurrentTerm(nextVersion.term);
      }
    },
    [activeVersionId, currentTermKey, versions, wordStoreApi],
  );

  const handleDeleteHistory = useCallback(async () => {
    const identifier = currentTerm;
    if (!identifier) return;
    try {
      await removeHistory(identifier, user);
      setEntry(null);
      setFinalText("");
      setStreamText("");
      setVersions([]);
      setActiveVersionId(null);
      setCurrentTermKey(null);
      setCurrentTerm("");
    } catch (error) {
      console.error("[DictionaryExperience] remove history failed", error);
    }
  }, [currentTerm, removeHistory, user]);

  const handleSelectHistory = useCallback(
    async (identifier: any, versionId?: string | number | null) => {
      if (!user) {
        navigate("/login");
        return;
      }
      const target =
        typeof identifier === "object" && identifier
          ? identifier
          : historyItems?.find(
              (item) => item.term === identifier || item.termKey === identifier,
            );
      const resolvedTerm =
        typeof identifier === "string" ? identifier : (target?.term ?? "");
      if (!resolvedTerm) return;
      const fallbackConfig = resolveDictionaryConfig(resolvedTerm, {
        sourceLanguage:
          (typeof identifier === "object" && identifier?.language) ||
          dictionarySourceLanguage ||
          WORD_LANGUAGE_AUTO,
        targetLanguage: dictionaryTargetLanguage,
      });
      const resolvedLanguage = target?.language ?? fallbackConfig.language;
      const resolvedFlavor =
        target?.flavor ??
        (typeof identifier === "object" && identifier?.language
          ? resolveDictionaryFlavor({
              sourceLanguage: identifier.language,
              targetLanguage: dictionaryTargetLanguage,
              resolvedSourceLanguage: fallbackConfig.language,
            })
          : dictionaryFlavor);
      const cacheKey = wordCacheKey({
        term: resolvedTerm,
        language: resolvedLanguage,
        flavor: resolvedFlavor,
        model: DEFAULT_MODEL,
      });
      setCurrentTermKey(cacheKey);
      const cachedRecord = wordStoreApi.getState().getRecord?.(cacheKey);

      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      if (cachedRecord) {
        const applied = applyRecord(
          cacheKey,
          cachedRecord,
          versionId ?? cachedRecord.activeVersionId,
        );
        if (applied) {
          setLoading(false);
          setStreamText("");
          setCurrentTerm(resolvedTerm);
          return;
        }
      }

      await executeLookup(resolvedTerm, {
        versionId,
        language: resolvedLanguage,
        flavor: resolvedFlavor,
      });
    },
    [
      user,
      navigate,
      historyItems,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
      dictionaryFlavor,
      wordStoreApi,
      abortRef,
      applyRecord,
      executeLookup,
    ],
  );

  useEffect(() => {
    loadHistory(user);
  }, [user, loadHistory]);

  useEffect(() => {
    if (!currentTermKey) return;
    const record = wordStoreApi.getState().getRecord?.(currentTermKey);
    if (record) {
      applyRecord(currentTermKey, record, record.activeVersionId);
    }
  }, [wordEntries, currentTermKey, applyRecord, wordStoreApi]);

  useEffect(() => {
    if (!user) {
      setEntry(null);
      setText("");
      setStreamText("");
      setFinalText("");
      setVersions([]);
      setActiveVersionId(null);
      setCurrentTermKey(null);
      setCurrentTerm("");
    }
  }, [user]);

  return {
    text,
    setText,
    entry,
    finalText,
    streamText,
    versions,
    activeVersionId,
    currentTerm,
    currentTermKey,
    loading,
    executeLookup,
    handleSend,
    handleReoutput,
    handleNavigateVersion,
    handleDeleteHistory,
    handleSelectHistory,
    unfavoriteHistory,
    user,
  };
}
