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
import { extractMarkdownPreview } from "@/utils";

function App() {
  const [text, setText] = useState("");
  const [entry, setEntry] = useState(null);
  const { t, lang, setLang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const { user } = useUser();
  const { loadHistory, addHistory, unfavoriteHistory } = useHistory();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fromFavorites, setFromFavorites] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [finalText, setFinalText] = useState("");
  const abortRef = useRef(null);
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const streamWord = useStreamWord();
  const { start: startSpeech } = useSpeechInput({ onResult: setText });

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

  const executeLookup = useCallback(
    async (term) => {
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
      setEntry(null);
      setStreamText("");
      setFinalText("");

      let detected;
      try {
        let acc = "";
        let preview = "";
        let parsedEntry = null;

        for await (const { chunk, language } of streamWord({
          user,
          term: normalized,
          signal: controller.signal,
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

        if (!parsedEntry) {
          setFinalText(preview);
        }

        console.info("[App] search complete", normalized);
        return {
          status: "success",
          term: normalized,
          detectedLanguage: detected,
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

  const handleSelectHistory = async (term) => {
    if (!user) {
      navigate("/login");
      return;
    }

    await executeLookup(term);
  };

  useEffect(() => {
    loadHistory(user);
  }, [user, loadHistory]);

  useEffect(() => {
    if (!user) {
      setEntry(null);
      setText("");
      setShowFavorites(false);
      setShowHistory(false);
      setFromFavorites(false);
      setStreamText("");
      setFinalText("");
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
          term: entry?.term || "",
          lang,
          showBack: !showFavorites && fromFavorites,
          onBack: handleBackFromFavorite,
          favorited: favorites.includes(entry?.term),
          onToggleFavorite: toggleFavoriteEntry,
          canFavorite: !!entry && !showFavorites && !showHistory,
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
