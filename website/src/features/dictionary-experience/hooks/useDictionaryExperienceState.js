import { useRef, useState } from "react";
import { DICTIONARY_EXPERIENCE_VIEWS } from "../dictionaryExperienceViews.js";

export function useDictionaryExperienceState() {
  const [text, setText] = useState("");
  const [entry, setEntry] = useState(null);
  const [finalText, setFinalText] = useState("");
  const [streamText, setStreamText] = useState("");
  const [currentTermKey, setCurrentTermKey] = useState(null);
  const [currentTerm, setCurrentTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState(
    DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
  );
  const inputRef = useRef(null);

  return {
    text,
    setText,
    entry,
    setEntry,
    finalText,
    setFinalText,
    streamText,
    setStreamText,
    currentTermKey,
    setCurrentTermKey,
    currentTerm,
    setCurrentTerm,
    loading,
    setLoading,
    activeView,
    setActiveView,
    inputRef,
  };
}
