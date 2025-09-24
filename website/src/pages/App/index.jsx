import { useState, useEffect, useRef, useCallback } from "react";
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
import { extractMarkdownPreview, detectWordLanguage } from "@/utils";
import { wordCacheKey } from "@/api/words.js";
import { useWordStore } from "@/store";
import { DEFAULT_MODEL } from "@/config";

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
  } = useHistory();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fromFavorites, setFromFavorites] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [currentTermKey, setCurrentTermKey] = useState(null);
  const [currentTerm, setCurrentTerm] = useState("");
  const wordEntries = useWordStore((state) => state.entries);
  const abortRef = useRef(null);
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const streamWord = useStreamWord();
  const { start: startSpeech } = useSpeechInput({ onResult: setText });
  const wordStoreApi = useWordStore;

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
    setFromFavorites(false);
  };

  const handleUnfavorite = (term) => {
    unfavoriteHistory(term, user);
    toggleFavorite(term);
  };

  const handleSelectFavorite = async (term) => {
    await handleSelectHistory(term);
    setShowFavorites(false);
    setFromFavorites(true);
  };

  const handleBackFromFavorite = () => {
    setShowFavorites(true);
    setFromFavorites(false);
    setEntry(null);
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
    async (term, { forceNew = false, versionId } = {}) => {
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
      const detectedLanguage = detectWordLanguage(normalized);
      const cacheKey = wordCacheKey({
        term: normalized,
        language: detectedLanguage,
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
              detectedLanguage,
            };
          }
        }
      }

      let detected;
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
        })) {
          if (!detected && language) detected = language;
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
          detectedLanguage: detected ?? detectedLanguage,
        };
      } catch (error) {
        if (error.name === "AbortError") {
          console.info("[App] search cancelled", normalized);
          return { status: "cancelled", term: normalized };
        }

        console.info("[App] search error", error);
        setPopupMsg(error.message);
        setPopupOpen(true);
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
      setPopupMsg,
      setPopupOpen,
      currentTermKey,
      wordStoreApi,
      applyRecord,
    ],
  );

  const handleSend = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!text.trim()) return;

    setFromFavorites(false);
    const input = text.trim();
    setText("");

    const result = await executeLookup(input);
    if (result.status === "success") {
      addHistory(input, user, result.detectedLanguage);
    }
  };

  const handleReoutput = useCallback(() => {
    if (!currentTerm) return;
    executeLookup(currentTerm, { forceNew: true });
  }, [currentTerm, executeLookup]);

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

  const handleSelectHistory = async (term, versionId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const target = historyItems?.find(
      (item) => item.term === term || item.termKey === term,
    );
    const resolvedLanguage = target?.language ?? detectWordLanguage(term);
    const cacheKey = wordCacheKey({
      term,
      language: resolvedLanguage,
      model: DEFAULT_MODEL,
    });
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
        setCurrentTerm(term);
        return;
      }
    }

    await executeLookup(term, { versionId });
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
      setFromFavorites(false);
      setStreamText("");
      setFinalText("");
      setVersions([]);
      setActiveVersionId(null);
      setCurrentTermKey(null);
      setCurrentTerm("");
    }
  }, [user]);

  return (
    <>
      <Layout
        sidebarProps={{
          onToggleFavorites: handleToggleFavorites,
          onSelectHistory: handleSelectHistory,
        }}
        topBarProps={{
          term: entry?.term || currentTerm,
          lang,
          showBack: !showFavorites && fromFavorites,
          onBack: handleBackFromFavorite,
          favorited:
            !!(entry?.term || currentTerm) &&
            favorites.includes(entry?.term || currentTerm),
          onToggleFavorite: toggleFavoriteEntry,
          canFavorite: !!entry && !showFavorites && !showHistory,
          canReoutput:
            !!(entry?.term || currentTerm) && !showFavorites && !showHistory,
          onReoutput: handleReoutput,
          versions: !showFavorites && !showHistory ? versions : [],
          activeVersionId:
            !showFavorites && !showHistory ? activeVersionId : null,
          onNavigateVersion:
            !showFavorites && !showHistory ? handleNavigateVersion : undefined,
          isLoading: loading,
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
