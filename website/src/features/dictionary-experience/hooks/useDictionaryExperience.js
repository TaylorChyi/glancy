import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useHistory,
  useUser,
  useFavorites,
  useTheme,
  useLanguage,
} from "@/context";
import { useStreamWord, useSpeechInput, useAppShortcuts } from "@/hooks";
import {
  extractMarkdownPreview,
  resolveDictionaryConfig,
  resolveDictionaryFlavor,
  WORD_LANGUAGE_AUTO,
  resolveShareTarget,
  attemptShareLink,
  polishDictionaryMarkdown,
  copyTextToClipboard,
} from "@/utils";
import { wordCacheKey } from "@/api/words.js";
import { useWordStore } from "@/store";
import { DEFAULT_MODEL, REPORT_FORM_URL, SUPPORT_EMAIL } from "@/config";
import { useDictionaryLanguageConfig } from "./useDictionaryLanguageConfig.js";
import { useDictionaryPopup } from "./useDictionaryPopup.js";

const resolveVersionIdentifier = (version) =>
  version?.id ??
  version?.versionId ??
  version?.metadata?.id ??
  version?.metadata?.versionId ??
  null;

const resolveVersionFingerprint = (version) => {
  if (!version) return "";
  const identifier = resolveVersionIdentifier(version);
  const updatedAt =
    version.updatedAt ??
    version.createdAt ??
    version.metadata?.updatedAt ??
    version.metadata?.createdAt ??
    null;
  const checksumSources = [
    version.metadata?.checksum,
    version.metadata?.hash,
    version.metadata?.sha,
    version.metadata?.digest,
  ];
  const resolvedChecksum = checksumSources.find(
    (value) => typeof value === "string" && value.length > 0,
  );
  const markdownSummary =
    typeof version.markdown === "string" && version.markdown.length > 0
      ? `${version.markdown.length}:${version.markdown.slice(0, 48)}`
      : "";
  const checksum = resolvedChecksum ?? markdownSummary;
  const term = version.term ?? "";
  const flavor = version.flavor ?? version.metadata?.flavor ?? "";
  return [identifier ?? "", updatedAt ?? "", checksum, term, flavor].join("#");
};

const getRecordSignature = (record) => {
  if (!record || !Array.isArray(record.versions)) return "record::empty";
  const active = record.activeVersionId ?? "";
  const payload = record.versions.map(resolveVersionFingerprint).join("||");
  return [active, payload].join("::");
};

export function useDictionaryExperience() {
  const [text, setText] = useState("");
  const [entry, setEntry] = useState(null);
  const { t, lang, setLang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const {
    history: historyItems,
    loadHistory,
    addHistory,
    unfavoriteHistory,
    removeHistory,
  } = useHistory();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [currentTermKey, setCurrentTermKey] = useState(null);
  const [currentTerm, setCurrentTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const wordEntries = useWordStore((state) => state.entries);
  const {
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
    sourceLanguageOptions,
    targetLanguageOptions,
    dictionaryFlavor,
    handleSwapLanguages,
  } = useDictionaryLanguageConfig({ t });
  const { popupOpen, popupMsg, showPopup, closePopup } = useDictionaryPopup();

  const abortRef = useRef(null);
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const streamWord = useStreamWord();
  const { start: startSpeech } = useSpeechInput({ onResult: setText });
  const wordStoreApi = useWordStore;
  const activeTerm = entry?.term || currentTerm;

  const copyPayload = useMemo(() => {
    const stringCandidates = [
      typeof entry?.markdown === "string" ? entry.markdown : null,
      typeof finalText === "string" ? finalText : null,
      typeof streamText === "string" ? streamText : null,
    ];

    for (const candidate of stringCandidates) {
      if (!candidate || !candidate.trim()) {
        continue;
      }
      const preview = extractMarkdownPreview(candidate);
      const normalized = preview == null ? candidate : preview;
      return polishDictionaryMarkdown(normalized);
    }

    if (entry && typeof entry === "object") {
      try {
        return JSON.stringify(entry, null, 2);
      } catch {
        return currentTerm || "";
      }
    }

    return currentTerm || "";
  }, [entry, finalText, streamText, currentTerm]);

  const canCopyDefinition = useMemo(
    () => typeof copyPayload === "string" && copyPayload.trim().length > 0,
    [copyPayload],
  );

  const handleCopy = useCallback(async () => {
    const copyLabel = t.copyAction || "Copy";
    if (!canCopyDefinition) {
      showPopup(t.copyEmpty || t.copyFailed || copyLabel);
      return;
    }

    const result = await copyTextToClipboard(copyPayload);
    if (result.status === "copied") {
      showPopup(t.copySuccess || copyLabel);
      return;
    }
    if (result.status === "empty") {
      showPopup(t.copyEmpty || t.copyFailed || copyLabel);
      return;
    }
    if (result.status === "unavailable") {
      showPopup(t.copyUnavailable || t.copyFailed || copyLabel);
      return;
    }
    showPopup(t.copyFailed || copyLabel);
  }, [
    canCopyDefinition,
    copyPayload,
    showPopup,
    t.copySuccess,
    t.copyEmpty,
    t.copyFailed,
    t.copyUnavailable,
    t.copyAction,
  ]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const { toggleFavoriteEntry } = useAppShortcuts({
    inputRef,
    lang,
    setLang,
    theme,
    setTheme,
    entry,
    showFavorites,
    showHistory,
    toggleFavorite,
  });

  const handleShowDictionary = useCallback(() => {
    setShowFavorites(false);
    setShowHistory(false);
    focusInput();
  }, [focusInput]);

  const handleShowFavorites = useCallback(() => {
    setShowFavorites(true);
    setShowHistory(false);
  }, []);

  const handleUnfavorite = useCallback(
    (term) => {
      unfavoriteHistory(term, user);
      toggleFavorite(term);
    },
    [unfavoriteHistory, user, toggleFavorite],
  );

  const handleVoice = useCallback(() => {
    const locale = lang === "en" ? "en-US" : "zh-CN";
    startSpeech(locale);
  }, [lang, startSpeech]);

  const applyRecord = useCallback(
    (termKey, record, preferredVersionId) => {
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
          (item) => String(item.id) === String(resolvedActiveId),
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
      term,
      {
        forceNew = false,
        versionId,
        language: preferredLanguage,
        flavor: preferredFlavor,
      } = {},
    ) => {
      const normalized = term.trim();
      if (!normalized) {
        return { status: "idle", term: normalized };
      }

      setShowFavorites(false);
      setShowHistory(false);
      if (abortRef.current) {
        abortRef.current.abort();
      }

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
      const cachedRecord = wordStoreApi.getState().getRecord?.(cacheKey);
      const cachedSignature = getRecordSignature(cachedRecord);
      const preferredVersionId =
        versionId ?? cachedRecord?.activeVersionId ?? null;
      const cachedApplied = cachedRecord
        ? applyRecord(cacheKey, cachedRecord, preferredVersionId)
        : false;
      const shouldResetView = (isNewTerm || forceNew) && !cachedApplied;
      setCurrentTermKey(cacheKey);
      setCurrentTerm(normalized);
      setStreamText("");
      if (shouldResetView) {
        setEntry(null);
        setFinalText("");
        setVersions([]);
        setActiveVersionId(null);
      }

      if (cachedApplied) {
        setShowFavorites(false);
        setShowHistory(false);
        setStreamText("");
        setCurrentTerm(normalized);
        if (!forceNew && !versionId) {
          setLoading(false);
          setIsRefreshing(false);
          abortRef.current = null;
          return {
            status: "success",
            term: normalized,
            detectedLanguage: resolvedLanguage,
            flavor: cachedRecord?.metadata?.flavor ?? targetFlavor,
          };
        }
      }

      const shouldStream = !cachedApplied || forceNew;
      if (!shouldStream) {
        setLoading(false);
        setIsRefreshing(false);
        abortRef.current = null;
        return {
          status: "success",
          term: normalized,
          detectedLanguage: resolvedLanguage,
          flavor: cachedRecord?.metadata?.flavor ?? targetFlavor,
        };
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(!cachedApplied);
      setIsRefreshing(cachedApplied);

      let detected = resolvedLanguage;
      try {
        let acc = "";
        let preview = "";
        let parsedEntry = null;

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
        const recordSignature = getRecordSignature(record);
        if (record && (!cachedApplied || recordSignature !== cachedSignature)) {
          applyRecord(cacheKey, record, record.activeVersionId);
        } else if (!cachedApplied && parsedEntry) {
          setEntry(parsedEntry);
          setFinalText(parsedEntry.markdown ?? "");
        } else {
          setFinalText(preview);
        }

        setCurrentTerm(normalized);
        return {
          status: "success",
          term: normalized,
          detectedLanguage: detected ?? resolvedLanguage,
          flavor: targetFlavor,
        };
      } catch (error) {
        if (error.name === "AbortError") {
          return { status: "cancelled", term: normalized };
        }

        showPopup(error.message);
        return { status: "error", term: normalized, error };
      } finally {
        setLoading(false);
        setIsRefreshing(false);
        abortRef.current = null;
      }
    },
    [
      streamWord,
      user,
      setShowFavorites,
      setShowHistory,
      setLoading,
      setEntry,
      setStreamText,
      setFinalText,
      showPopup,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
      currentTermKey,
      setCurrentTermKey,
      setCurrentTerm,
      wordStoreApi,
      applyRecord,
    ],
  );

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
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
    [
      user,
      navigate,
      text,
      setText,
      executeLookup,
      addHistory,
      dictionaryFlavor,
    ],
  );

  const handleReoutput = useCallback(() => {
    if (!currentTerm) return;
    executeLookup(currentTerm, { forceNew: true });
  }, [currentTerm, executeLookup]);

  const handleShare = useCallback(async () => {
    if (!activeTerm) return;

    const currentUrl =
      typeof window !== "undefined" && window.location
        ? window.location.href
        : "";

    const shareUrl = resolveShareTarget({ currentUrl });
    const applyTermTemplate = (template, fallback) => {
      if (typeof template === "string" && template.length > 0) {
        return template.split("{term}").join(activeTerm);
      }
      return fallback;
    };

    const shareText = applyTermTemplate(t.shareMessage, activeTerm);
    const shareTitle = activeTerm;

    try {
      const result = await attemptShareLink({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });

      if (result.status === "shared") {
        showPopup(t.shareSuccess ?? t.share ?? shareTitle);
      } else if (result.status === "copied") {
        showPopup(t.shareCopySuccess ?? t.shareSuccess ?? shareTitle);
      } else if (result.status === "failed") {
        showPopup(t.shareFailed ?? t.share ?? shareTitle);
      }
    } catch (error) {
      console.error("[DictionaryExperience] share failed", error);
      showPopup(t.shareFailed ?? t.share ?? shareTitle);
    }
  }, [
    activeTerm,
    t.shareMessage,
    t.shareSuccess,
    t.share,
    t.shareCopySuccess,
    t.shareFailed,
    showPopup,
  ]);

  const handleDeleteHistory = useCallback(async () => {
    const identifier = activeTerm;
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
      setIsRefreshing(false);
    } catch (error) {
      console.error("[DictionaryExperience] remove history failed", error);
    }
  }, [activeTerm, removeHistory, user]);

  const handleReport = useCallback(() => {
    if (!activeTerm) return;

    const currentUrl =
      typeof window !== "undefined" && window.location
        ? window.location.href
        : "";

    const buildReportTarget = () => {
      if (REPORT_FORM_URL) {
        try {
          const base =
            currentUrl ||
            (typeof window !== "undefined" && window.location
              ? `${window.location.origin}/`
              : "http://localhost/");
          const reportUrl = new URL(REPORT_FORM_URL, base);
          reportUrl.searchParams.set("term", activeTerm);
          if (currentUrl) {
            reportUrl.searchParams.set("source", currentUrl);
          }
          return reportUrl.toString();
        } catch (error) {
          console.error(
            "[DictionaryExperience] report url resolution failed",
            error,
          );
        }
      }

      if (SUPPORT_EMAIL) {
        const subject = encodeURIComponent(`[Glancy] Report: ${activeTerm}`);
        const lines = [
          `Term: ${activeTerm}`,
          currentUrl ? `Page: ${currentUrl}` : null,
          "",
          "Describe the issue here:",
        ].filter(Boolean);
        const body = encodeURIComponent(lines.join("\n"));
        return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      }

      return "";
    };

    const target = buildReportTarget();

    if (!target) {
      showPopup(t.reportUnavailable ?? t.reportFailed ?? t.report ?? "Report");
      return;
    }

    const openReportChannel = () => {
      if (typeof window === "undefined") return false;
      if (target.startsWith("mailto:")) {
        window.location.href = target;
        return true;
      }
      const newWindow = window.open(target, "_blank", "noopener,noreferrer");
      return newWindow != null;
    };

    try {
      const opened = openReportChannel();
      if (opened) {
        showPopup(t.reportSuccess ?? t.report ?? "Report");
      } else {
        showPopup(t.reportFailed ?? t.report ?? "Report");
      }
    } catch (error) {
      console.error("[DictionaryExperience] report open failed", error);
      showPopup(t.reportFailed ?? t.report ?? "Report");
    }
  }, [
    activeTerm,
    showPopup,
    t.reportUnavailable,
    t.reportFailed,
    t.report,
    t.reportSuccess,
  ]);

  const handleNavigateVersion = useCallback(
    (direction) => {
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
    [
      currentTermKey,
      versions,
      activeVersionId,
      wordStoreApi,
      setEntry,
      setFinalText,
    ],
  );

  const handleSelectHistory = useCallback(
    async (identifier, versionId) => {
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
          setShowFavorites(false);
          setShowHistory(false);
          setLoading(false);
          setStreamText("");
          setIsRefreshing(false);
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
      applyRecord,
      executeLookup,
      setLoading,
      setStreamText,
    ],
  );

  const handleSelectFavorite = useCallback(
    async (term) => {
      await handleSelectHistory(term);
      setShowFavorites(false);
    },
    [handleSelectHistory],
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
      setShowFavorites(false);
      setShowHistory(false);
      setStreamText("");
      setFinalText("");
      setVersions([]);
      setActiveVersionId(null);
      setCurrentTermKey(null);
      setCurrentTerm("");
      setIsRefreshing(false);
    }
  }, [user]);

  const activeSidebarView = useMemo(() => {
    if (showFavorites) return "favorites";
    if (showHistory) return "history";
    return "dictionary";
  }, [showFavorites, showHistory]);

  const isEntryViewActive = !showFavorites && !showHistory;
  const resolvedTerm = activeTerm;
  const hasResolvedEntry = isEntryViewActive && Boolean(entry);
  const isTermActionable = isEntryViewActive && Boolean(resolvedTerm);
  const isEmptyStateActive = useMemo(
    () =>
      !showFavorites &&
      !showHistory &&
      !entry &&
      !finalText &&
      !streamText &&
      !loading,
    [showFavorites, showHistory, entry, finalText, streamText, loading],
  );
  const displayClassName = useMemo(
    () =>
      ["display", isEmptyStateActive ? "display-empty" : ""]
        .filter(Boolean)
        .join(" "),
    [isEmptyStateActive],
  );

  const dictionaryActionBarProps = useMemo(
    () => ({
      visible: hasResolvedEntry,
      term: resolvedTerm,
      lang,
      onReoutput: handleReoutput,
      disabled: !isTermActionable || loading,
      versions: isEntryViewActive ? versions : [],
      activeVersionId: isEntryViewActive ? activeVersionId : null,
      onNavigate: isEntryViewActive ? handleNavigateVersion : undefined,
      onCopy: handleCopy,
      canCopy: canCopyDefinition,
      favorited: Boolean(resolvedTerm && favorites.includes(resolvedTerm)),
      onToggleFavorite: toggleFavoriteEntry,
      canFavorite: hasResolvedEntry && isTermActionable,
      canDelete: isTermActionable,
      onDelete: isEntryViewActive ? handleDeleteHistory : undefined,
      canShare: isTermActionable,
      onShare: isEntryViewActive ? handleShare : undefined,
      canReport: isTermActionable,
      onReport: isEntryViewActive ? handleReport : undefined,
    }),
    [
      hasResolvedEntry,
      resolvedTerm,
      lang,
      handleReoutput,
      isTermActionable,
      loading,
      isEntryViewActive,
      versions,
      activeVersionId,
      handleNavigateVersion,
      handleCopy,
      canCopyDefinition,
      favorites,
      toggleFavoriteEntry,
      handleDeleteHistory,
      handleShare,
      handleReport,
    ],
  );

  return {
    inputRef,
    t,
    text,
    setText,
    dictionarySourceLanguage,
    setDictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionaryTargetLanguage,
    sourceLanguageOptions,
    targetLanguageOptions,
    handleSwapLanguages,
    handleSend,
    handleVoice,
    showFavorites,
    showHistory,
    handleShowDictionary,
    handleShowFavorites,
    handleSelectHistory,
    handleSelectFavorite,
    handleUnfavorite,
    favorites,
    activeSidebarView,
    focusInput,
    entry,
    finalText,
    streamText,
    loading,
    isRefreshing,
    dictionaryActionBarProps,
    displayClassName,
    isEmptyStateActive,
    popupOpen,
    popupMsg,
    closePopup,
    handleCopy,
    canCopyDefinition,
    lang,
    dictionaryFlavor,
    dictionaryTargetLanguageLabel: t.dictionaryTargetLanguageLabel,
    dictionarySourceLanguageLabel: t.dictionarySourceLanguageLabel,
    dictionarySwapLanguagesLabel: t.dictionarySwapLanguages,
    favoritesEmptyState: {
      title: t.favoritesEmptyTitle,
      description: t.favoritesEmptyDescription,
      actionLabel: t.favoritesEmptyAction,
      removeLabel: t.favoriteRemove,
    },
    searchEmptyState: {
      title: t.searchEmptyTitle,
      description: t.searchEmptyDescription,
    },
    chatInputPlaceholder: t.inputPlaceholder,
  };
}
