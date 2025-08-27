import { useState, useEffect, useRef } from "react";
import MessagePopup from "@/components/ui/MessagePopup";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context";
import { useLanguage } from "@/context";
import { useHistory } from "@/context/HistoryContext.jsx";
import { useUser } from "@/context/UserContext.jsx";
import { useFavorites } from "@/context/FavoritesContext.jsx";
import { useStreamWord, useSpeechInput } from "@/hooks";
import "./App.css";
import ChatInput from "@/components/ui/ChatInput";
import Layout from "@/components/Layout";
import { useModelStore } from "@/store";
import ICP from "@/components/ui/ICP";
import { useAppShortcuts } from "@/hooks";
import SearchDisplay from "./SearchDisplay.jsx";
import FavoritesPanel from "./FavoritesPanel.jsx";
import HistoryPanel from "./HistoryPanel.jsx";

function App() {
  const [text, setText] = useState("");
  const [entry, setEntry] = useState(null);
  const { t, lang, setLang } = useLanguage();
  const placeholder = t.searchPlaceholder;
  const [loading, setLoading] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const { user } = useUser();
  const { history, loadHistory, addHistory, unfavoriteHistory } = useHistory();
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
  const { model } = useModelStore();
  const { start: startSpeech } = useSpeechInput({ onResult: setText });

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (!text.trim()) return;
    setShowFavorites(false);
    setShowHistory(false);
    const input = text.trim();
    setText("");
    console.info("[App] search start", input);
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
      let parsedEntry = null;
      for await (const { chunk, language } of streamWord({
        user,
        term: input,
        model,
        signal: controller.signal,
      })) {
        if (!detected) detected = language;
        acc += chunk;
        setStreamText((prev) => prev + chunk);
        try {
          parsedEntry = JSON.parse(acc);
          setEntry(parsedEntry);
        } catch {
          // ignore parse errors until JSON is complete
        }
      }
      if (!parsedEntry) {
        setFinalText(acc);
      }
      addHistory(input, user, detected);
      console.info("[App] search complete", input);
    } catch (error) {
      if (error.name === "AbortError") {
        console.info("[App] search cancelled", input);
      } else {
        console.info("[App] search error", error);
        setPopupMsg(error.message);
        setPopupOpen(true);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const handleSelectHistory = async (term) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setShowFavorites(false);
    setShowHistory(false);
    console.info("[App] search start", term);
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
    try {
      let acc = "";
      let parsedEntry = null;
      for await (const { chunk } of streamWord({
        user,
        term,
        model,
        signal: controller.signal,
      })) {
        acc += chunk;
        setStreamText((prev) => prev + chunk);
        try {
          parsedEntry = JSON.parse(acc);
          setEntry(parsedEntry);
        } catch {
          // ignore parse errors until JSON is complete
        }
      }
      if (!parsedEntry) {
        setFinalText(acc);
      }
      console.info("[App] search complete", term);
    } catch (error) {
      if (error.name === "AbortError") {
        console.info("[App] search cancelled", term);
      } else {
        console.info("[App] search error", error);
        setPopupMsg(error.message);
        setPopupOpen(true);
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
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
          <ChatInput
            inputRef={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onSubmit={handleSend}
            onVoice={handleVoice}
            placeholder={t.inputPlaceholder}
          />
        }
      >
        <div className="display">
          {showFavorites ? (
            <FavoritesPanel
              favorites={favorites}
              onSelect={handleSelectFavorite}
              onUnfavorite={handleUnfavorite}
              emptyMessage={t.noFavorites}
            />
          ) : showHistory ? (
            <HistoryPanel
              history={history}
              onSelect={handleSelectHistory}
              emptyMessage={t.noHistory}
            />
          ) : (
            <SearchDisplay
              loading={loading}
              entry={entry}
              streamText={streamText}
              finalText={finalText}
              placeholder={placeholder}
            />
          )}
        </div>
      </Layout>
      <ICP />
      <MessagePopup
        open={popupOpen}
        message={popupMsg}
        onClose={() => setPopupOpen(false)}
      />
    </>
  );
}

export default App;
