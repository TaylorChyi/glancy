import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import MessagePopup from "@/components/ui/MessagePopup";
import { useHistory, useUser, useFavorites } from "@/context";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context";
import { DictionaryEntryView } from "@/components/ui/DictionaryEntry";
import { useLanguage } from "@/context";
import { useStreamWord, useSpeechInput } from "@/hooks";
import "./App.css";
import ChatInput from "@/components/ui/ChatInput";
import Layout from "@/components/Layout";
import HistoryDisplay from "@/components/ui/HistoryDisplay";
import ICP from "@/components/ui/ICP";
import FavoritesView from "./FavoritesView.jsx";
import { useAppShortcuts } from "@/hooks";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import DictionaryEntryActionBar from "@/components/DictionaryEntryActionBar";
import {
  extractMarkdownPreview,
  resolveDictionaryConfig,
  resolveDictionaryFlavor,
  WORD_LANGUAGE_AUTO,
  normalizeWordSourceLanguage,
  normalizeWordTargetLanguage,
  resolveShareTarget,
  attemptShareLink,
} from "@/utils";
import { wordCacheKey } from "@/api/words.js";
import { useWordStore, useSettingsStore } from "@/store";
import { DEFAULT_MODEL, REPORT_FORM_URL, SUPPORT_EMAIL } from "@/config";

function App() {
  const [text, setText] = useState("");
  const [entry, setEntry] = useState(null);
  const { t, lang, setLang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
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
  const wordEntries = useWordStore((state) => state.entries);
  const dictionarySourceLanguage = useSettingsStore(
    (state) => state.dictionarySourceLanguage,
  );
  const setDictionarySourceLanguage = useSettingsStore(
    (state) => state.setDictionarySourceLanguage,
  );
  const dictionaryTargetLanguage = useSettingsStore(
    (state) => state.dictionaryTargetLanguage,
  );
  const setDictionaryTargetLanguage = useSettingsStore(
    (state) => state.setDictionaryTargetLanguage,
  );
  const sourceLanguageOptions = useMemo(
    () => [
      {
        value: WORD_LANGUAGE_AUTO,
        label: t.dictionarySourceLanguageAuto,
        description: t.dictionarySourceLanguageAutoDescription,
      },
      {
        value: "ENGLISH",
        label: t.dictionarySourceLanguageEnglish,
        description: t.dictionarySourceLanguageEnglishDescription,
      },
      {
        value: "CHINESE",
        label: t.dictionarySourceLanguageChinese,
        description: t.dictionarySourceLanguageChineseDescription,
      },
    ],
    [
      t.dictionarySourceLanguageAuto,
      t.dictionarySourceLanguageAutoDescription,
      t.dictionarySourceLanguageEnglish,
      t.dictionarySourceLanguageEnglishDescription,
      t.dictionarySourceLanguageChinese,
      t.dictionarySourceLanguageChineseDescription,
    ],
  );
  const targetLanguageOptions = useMemo(
    () => [
      {
        value: "CHINESE",
        label: t.dictionaryTargetLanguageChinese,
        description: t.dictionaryTargetLanguageChineseDescription,
      },
      {
        value: "ENGLISH",
        label: t.dictionaryTargetLanguageEnglish,
        description: t.dictionaryTargetLanguageEnglishDescription,
      },
    ],
    [
      t.dictionaryTargetLanguageChinese,
      t.dictionaryTargetLanguageChineseDescription,
      t.dictionaryTargetLanguageEnglish,
      t.dictionaryTargetLanguageEnglishDescription,
    ],
  );
  const dictionaryFlavor = useMemo(
    () =>
      resolveDictionaryFlavor({
        sourceLanguage: dictionarySourceLanguage,
        targetLanguage: dictionaryTargetLanguage,
      }),
    [dictionarySourceLanguage, dictionaryTargetLanguage],
  );
  const handleSwapLanguages = useCallback(() => {
    const normalizedSource = normalizeWordSourceLanguage(
      dictionarySourceLanguage,
    );
    const normalizedTarget = normalizeWordTargetLanguage(
      dictionaryTargetLanguage,
    );

    const nextSource = normalizedTarget;
    const nextTarget =
      normalizedSource === WORD_LANGUAGE_AUTO
        ? normalizedTarget === "CHINESE"
          ? "ENGLISH"
          : "CHINESE"
        : normalizeWordTargetLanguage(normalizedSource);

    setDictionarySourceLanguage(nextSource);
    setDictionaryTargetLanguage(nextTarget);
  }, [
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    setDictionarySourceLanguage,
    setDictionaryTargetLanguage,
  ]);
  const abortRef = useRef(null);
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const streamWord = useStreamWord();
  const { start: startSpeech } = useSpeechInput({ onResult: setText });
  const wordStoreApi = useWordStore;
  const activeTerm = entry?.term || currentTerm;

  const showPopup = useCallback((message) => {
    if (!message) return;
    setPopupMsg(message);
    setPopupOpen(true);
  }, []);

  const focusInput = () => {
    inputRef.current?.focus();
  };

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

  const handleToggleFavorites = () => {
    // always show favorites when invoked
    setShowFavorites(true);
    setShowHistory(false);
  };

  const handleUnfavorite = (term) => {
    unfavoriteHistory(term, user);
    toggleFavorite(term);
  };

  const handleSelectFavorite = async (term) => {
    await handleSelectHistory(term);
    setShowFavorites(false);
  };

  const handleVoice = () => {
    const locale = lang === "en" ? "en-US" : "zh-CN";
    startSpeech(locale);
  };

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
      console.info("[App] search start", normalized);

      if (abortRef.current) {
        console.info("[App] search cancel previous");
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
              status: "success",
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
            // ignore parse errors until JSON is complete
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
        console.info("[App] search complete", normalized);
        return {
          status: "success",
          term: normalized,
          detectedLanguage: detected ?? resolvedLanguage,
          flavor: targetFlavor,
        };
      } catch (error) {
        if (error.name === "AbortError") {
          console.info("[App] search cancelled", normalized);
          return { status: "cancelled", term: normalized };
        }

        console.info("[App] search error", error);
        showPopup(error.message);
        return { status: "error", term: normalized, error };
      } finally {
        setLoading(false);
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
      currentTermKey,
      wordStoreApi,
      applyRecord,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
    ],
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!text.trim()) return;

    const input = text.trim();
    setText("");

    const result = await executeLookup(input);
    if (result.status === "success") {
      addHistory(
        input,
        user,
        result.detectedLanguage,
        result.flavor ?? dictionaryFlavor,
      );
    }
  };

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
      console.error("[App] share failed", error);
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
    } catch (err) {
      console.error("[App] remove history failed", err);
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
          console.error("[App] report url resolution failed", error);
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
      console.error("[App] report open failed", error);
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

  const handleSelectHistory = async (identifier, versionId) => {
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
        setCurrentTerm(resolvedTerm);
        return;
      }
    }

    await executeLookup(resolvedTerm, {
      versionId,
      language: resolvedLanguage,
      flavor: resolvedFlavor,
    });
  };

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
    }
  }, [user]);

  const isEntryViewActive = !showFavorites && !showHistory;
  const resolvedTerm = activeTerm;
  const hasResolvedEntry = isEntryViewActive && Boolean(entry);
  const isTermActionable = isEntryViewActive && Boolean(resolvedTerm);
  const dictionaryActionBar = (
    <DictionaryEntryActionBar
      visible={hasResolvedEntry}
      term={resolvedTerm}
      lang={lang}
      onReoutput={handleReoutput}
      disabled={!isTermActionable || loading}
      versions={isEntryViewActive ? versions : []}
      activeVersionId={isEntryViewActive ? activeVersionId : null}
      onNavigate={isEntryViewActive ? handleNavigateVersion : undefined}
      favorited={Boolean(resolvedTerm && favorites.includes(resolvedTerm))}
      onToggleFavorite={toggleFavoriteEntry}
      canFavorite={hasResolvedEntry && isTermActionable}
      canDelete={isTermActionable}
      onDelete={isEntryViewActive ? handleDeleteHistory : undefined}
      canShare={isTermActionable}
      onShare={isEntryViewActive ? handleShare : undefined}
      canReport={isTermActionable}
      onReport={isEntryViewActive ? handleReport : undefined}
      {...toolbarLanguageProps}
    />
  );

  return (
    <>
      <Layout
        sidebarProps={{
          onToggleFavorites: handleToggleFavorites,
          onSelectHistory: handleSelectHistory,
        }}
        bottomContent={
          <div>
            <ChatInput
              inputRef={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onSubmit={handleSend}
              onVoice={handleVoice}
              placeholder={t.inputPlaceholder}
              maxRows={5}
              sourceLanguage={dictionarySourceLanguage}
              sourceLanguageOptions={sourceLanguageOptions}
              sourceLanguageLabel={t.dictionarySourceLanguageLabel}
              onSourceLanguageChange={setDictionarySourceLanguage}
              targetLanguage={dictionaryTargetLanguage}
              targetLanguageOptions={targetLanguageOptions}
              targetLanguageLabel={t.dictionaryTargetLanguageLabel}
              onTargetLanguageChange={setDictionaryTargetLanguage}
              onSwapLanguages={handleSwapLanguages}
              swapLabel={t.dictionarySwapLanguages}
              normalizeSourceLanguageFn={normalizeWordSourceLanguage}
              normalizeTargetLanguageFn={normalizeWordTargetLanguage}
            />
            <ICP />
          </div>
        }
      >
        <div className="display">
          {showFavorites ? (
            <FavoritesView
              favorites={favorites}
              onSelect={handleSelectFavorite}
              onUnfavorite={handleUnfavorite}
              emptyTitle={t.favoritesEmptyTitle}
              emptyDescription={t.favoritesEmptyDescription}
              emptyActionLabel={t.favoritesEmptyAction}
              onEmptyAction={() => {
                setShowFavorites(false);
                focusInput();
              }}
              unfavoriteLabel={t.favoriteRemove}
            />
          ) : showHistory ? (
            <HistoryDisplay
              onEmptyAction={() => {
                setShowHistory(false);
                focusInput();
              }}
              onSelect={handleSelectHistory}
            />
          ) : entry || finalText || streamText || loading ? (
            <DictionaryEntryView
              entry={entry}
              preview={finalText || streamText}
              isLoading={loading}
              actions={dictionaryActionBar}
            />
          ) : (
            <EmptyState
              iconName="target"
              title={t.searchEmptyTitle}
              description={t.searchEmptyDescription}
              actions={
                <Button type="button" onClick={focusInput}>
                  {t.searchEmptyAction}
                </Button>
              }
            />
          )}
        </div>
      </Layout>
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}

export default App;
