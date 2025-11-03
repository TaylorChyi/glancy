/**
 * 背景：
 *  - useDictionaryExperience 需维护大量 UI 状态，使主文件冗长难以维护。
 * 目的：
 *  - 将所有本地状态初始化集中在一个自定义 Hook 中，保持主入口聚焦在编排逻辑。
 * 关键决策与取舍：
 *  - 仅关注局部状态（useState/useRef），跨模块依赖由上层注入，避免重复读取上下文；
 *  - 按用途命名字段，提升语义清晰度与组合灵活性。
 * 影响范围：
 *  - DictionaryExperience 主 Hook；其他模块可复用该状态容器进行组合测试。
 * 演进与TODO：
 *  - 后续可在此加入 useReducer，以便记录更多状态变更轨迹用于调试。
 */
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
