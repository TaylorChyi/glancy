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
import { useDictionaryLookupController } from "./useDictionaryLookupController.ts";
import {
  DICTIONARY_EXPERIENCE_VIEWS,
  isDictionaryView,
  isHistoryView,
  isLibraryView,
} from "../dictionaryExperienceViews.js";

/**
 * 背景：
 *  - 复制操作的反馈此前仅依赖弹窗提示，用户无法快速辨识当前按钮是否可再次复制。
 * 目的：
 *  - 建立一个可扩展的复制反馈状态机，为工具栏按钮提供语义化的交互源数据。
 * 关键决策与取舍：
 *  - 采用有限状态机常量而非布尔标志，便于未来扩展错误、处理中等状态；
 *  - 通过计时器在成功 2 秒后回退至初始态，兼顾即时反馈与连续复制需求。
 * 影响范围：
 *  - DictionaryExperience 与其子组件使用的复制按钮状态。
 * 演进与TODO：
 *  - 后续可根据 copyFeedbackState 扩展更多视觉反馈，如错误提示高亮。
 */
export const COPY_FEEDBACK_STATES = Object.freeze({
  IDLE: "idle",
  SUCCESS: "success",
});

const COPY_FEEDBACK_RESET_DELAY_MS = 2000;

// 确保词条统一走修剪流程，避免出现空白历史条目并便于后续复用。
const coerceResolvedTerm = (candidate, fallback) => {
  if (typeof candidate !== "string") return fallback;
  const trimmed = candidate.trim();
  return trimmed || fallback;
};

export function useDictionaryExperience() {
  const [text, setText] = useState("");
  const [entry, setEntry] = useState(null);
  const { t, lang, setLang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [copyFeedbackState, setCopyFeedbackState] = useState(
    COPY_FEEDBACK_STATES.IDLE,
  );
  const { user } = useUser();
  const {
    history: historyItems,
    loadHistory,
    addHistory,
    removeHistory,
  } = useHistory();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef(null);
  const [activeView, setActiveView] = useState(
    DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY,
  );
  const [streamText, setStreamText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [currentTermKey, setCurrentTermKey] = useState(null);
  const [currentTerm, setCurrentTerm] = useState("");
  const copyFeedbackResetTimerRef = useRef(null);
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

  const { beginLookup, cancelActiveLookup, clearActiveLookup, isMounted } =
    useDictionaryLookupController();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const streamWord = useStreamWord();
  const { start: startSpeech } = useSpeechInput({ onResult: setText });
  const wordStoreApi = useWordStore;
  const activeTerm = entry?.term || currentTerm;
  const isDictionaryViewActive = isDictionaryView(activeView);
  const isHistoryViewActive = isHistoryView(activeView);
  const isLibraryViewActive = isLibraryView(activeView);
  const libraryLandingLabel = useMemo(() => {
    if (t.primaryNavLibraryLabel) return t.primaryNavLibraryLabel;
    if (t.favorites) return t.favorites;
    if (t.primaryNavEntriesLabel) return t.primaryNavEntriesLabel;
    return "致用单词";
  }, [t.favorites, t.primaryNavEntriesLabel, t.primaryNavLibraryLabel]);

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

  /**
   * 背景：
   *  - 复制成功的反馈此前通过弹窗提示，与工具栏上的图标状态重复且分散。
   * 目的：
   *  - 以策略映射集中维护各状态对应的弹窗文案，便于未来扩展，同时允许在成功态下静默处理。
   * 关键决策与取舍：
   *  - 采用冻结对象提供不可变映射，确保回调依赖稳定；
   *  - 针对 copied 状态返回 null，以保留弹窗通道但避免与按钮态重复提示。
   */
  const copyFeedbackMessages = useMemo(() => {
    const base = t.copyAction || "Copy";
    const failure = t.copyFailed || base;
    return Object.freeze({
      base,
      fallback: failure,
      statuses: Object.freeze({
        copied: null,
        empty: t.copyEmpty || failure,
        unavailable: t.copyUnavailable || failure,
        failed: failure,
        default: failure,
      }),
    });
  }, [t.copyAction, t.copyFailed, t.copyEmpty, t.copyUnavailable]);

  const resolveCopyPopupMessage = useCallback(
    (status) => {
      const { base, fallback, statuses } = copyFeedbackMessages;
      const resolvedFallback =
        statuses.default ?? fallback ?? base ?? "Copy";
      if (!status) {
        return resolvedFallback;
      }
      if (Object.prototype.hasOwnProperty.call(statuses, status)) {
        return statuses[status];
      }
      return resolvedFallback;
    },
    [copyFeedbackMessages],
  );

  const pushCopyPopup = useCallback(
    (status) => {
      const message = resolveCopyPopupMessage(status);
      if (message) {
        showPopup(message);
      }
    },
    [resolveCopyPopupMessage, showPopup],
  );

  const clearCopyFeedbackResetTimer = useCallback(() => {
    if (copyFeedbackResetTimerRef.current) {
      clearTimeout(copyFeedbackResetTimerRef.current);
      copyFeedbackResetTimerRef.current = null;
    }
  }, []);

  const scheduleCopyFeedbackReset = useCallback(() => {
    clearCopyFeedbackResetTimer();
    copyFeedbackResetTimerRef.current = setTimeout(() => {
      setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE);
      copyFeedbackResetTimerRef.current = null;
    }, COPY_FEEDBACK_RESET_DELAY_MS);
  }, [clearCopyFeedbackResetTimer]);

  const handleCopy = useCallback(async () => {
    if (!canCopyDefinition) {
      setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE);
      pushCopyPopup("empty");
      return;
    }

    try {
      const result = await copyTextToClipboard(copyPayload);
      if (result.status === "copied") {
        setCopyFeedbackState(COPY_FEEDBACK_STATES.SUCCESS);
        scheduleCopyFeedbackReset();
        pushCopyPopup("copied");
        return;
      }

      setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE);
      pushCopyPopup(result.status || "default");
    } catch {
      setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE);
      pushCopyPopup("failed");
    }
  }, [
    canCopyDefinition,
    copyPayload,
    scheduleCopyFeedbackReset,
    pushCopyPopup,
  ]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(
    () => () => {
      clearCopyFeedbackResetTimer();
    },
    [clearCopyFeedbackResetTimer],
  );

  /**
   * 意图：集中回收词典首页所依赖的查询状态，保证任意入口返回首页时体验一致。
   * 输入：无显式参数，通过闭包访问当前 Hook 状态。
   * 输出：副作用：终止流式查询、清空释义相关状态并重置视图聚焦。
   * 流程：
   *  1) 终止仍在运行的查询以避免竞争态；
   *  2) 归零释义/版本/加载等状态，恢复收藏与历史侧边栏的关闭态；
   *  3) 聚焦输入框，方便继续输入。
   * 错误处理：取消查询失败时由内部控制器保障幂等。
   * 复杂度：O(1)；只操作常量数量的状态。
   * 设计取舍：集中重置可避免散落在多处的清理逻辑发生漂移，相比逐处手动设置可显著降低未来新增状态时的遗漏风险。
   */
  const resetDictionaryHomeState = useCallback(() => {
    cancelActiveLookup();
    clearCopyFeedbackResetTimer();
    setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE);
    setEntry(null);
    setFinalText("");
    setStreamText("");
    setLoading(false);
    setVersions([]);
    setActiveVersionId(null);
    setCurrentTermKey(null);
    setCurrentTerm("");
    setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
    focusInput();
  }, [
    cancelActiveLookup,
    clearCopyFeedbackResetTimer,
    focusInput,
    setActiveView,
  ]);

  const { toggleFavoriteEntry } = useAppShortcuts({
    inputRef,
    lang,
    setLang,
    theme,
    setTheme,
    entry,
    isDictionaryViewActive,
    toggleFavorite,
  });

  const handleShowDictionary = useCallback(() => {
    resetDictionaryHomeState();
  }, [resetDictionaryHomeState]);

  const handleShowLibrary = useCallback(() => {
    setActiveView(DICTIONARY_EXPERIENCE_VIEWS.LIBRARY);
  }, [setActiveView]);

  const handleVoice = useCallback(() => {
    const locale = lang === "en" ? "en-US" : "zh-CN";
    startSpeech(locale);
  }, [lang, startSpeech]);

  const applyRecord = useCallback(
    (termKey, record, preferredVersionId) => {
      if (!termKey || !record || !Array.isArray(record.versions)) return null;
      if (record.versions.length === 0) {
        setVersions([]);
        setActiveVersionId(null);
        return null;
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
      return resolvedEntry ?? null;
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

      setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
      clearCopyFeedbackResetTimer();
      setCopyFeedbackState(COPY_FEEDBACK_STATES.IDLE);
      const controller = beginLookup();

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

      let resolvedTerm = normalized;

      if (!forceNew && versionId) {
        const cachedRecord = wordStoreApi.getState().getRecord?.(cacheKey);
        if (cachedRecord) {
          const hydrated = applyRecord(cacheKey, cachedRecord, versionId);
          if (hydrated) {
            resolvedTerm = coerceResolvedTerm(hydrated.term, normalized);
            setLoading(false);
            clearActiveLookup();
            return {
              status: "success",
              term: resolvedTerm,
              queriedTerm: normalized,
              detectedLanguage: resolvedLanguage,
              flavor: targetFlavor,
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
            // waiting for JSON to finish streaming
          }
        }

        const record = wordStoreApi.getState().getRecord?.(cacheKey);
        if (record) {
          const hydratedRecord = applyRecord(
            cacheKey,
            record,
            record.activeVersionId,
          );
          if (hydratedRecord?.term) {
            resolvedTerm = coerceResolvedTerm(
              hydratedRecord.term,
              normalized,
            );
          }
        } else if (parsedEntry) {
          setEntry(parsedEntry);
          setFinalText(parsedEntry.markdown ?? "");
          resolvedTerm = coerceResolvedTerm(parsedEntry.term, normalized);
        } else {
          setFinalText(preview);
        }

        const detectedLanguage = detected ?? resolvedLanguage;
        setCurrentTerm(resolvedTerm);
        return {
          status: "success",
          term: resolvedTerm,
          queriedTerm: normalized,
          detectedLanguage,
          flavor: targetFlavor,
        };
      } catch (error) {
        if (error.name === "AbortError") {
          return { status: "cancelled", term: normalized };
        }

        showPopup(error.message);
        return { status: "error", term: normalized, error };
      } finally {
        if (!controller.signal.aborted && isMounted()) {
          setLoading(false);
        }
        clearActiveLookup();
      }
    },
    [
      streamWord,
      user,
      beginLookup,
      setActiveView,
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
      isMounted,
      clearActiveLookup,
      clearCopyFeedbackResetTimer,
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
        const historyTerm =
          result.term ?? result.queriedTerm ?? inputValue;
        addHistory(
          historyTerm,
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

      cancelActiveLookup();

      if (cachedRecord) {
        const applied = applyRecord(
          cacheKey,
          cachedRecord,
          versionId ?? cachedRecord.activeVersionId,
        );
        if (applied) {
          setActiveView(DICTIONARY_EXPERIENCE_VIEWS.DICTIONARY);
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
      cancelActiveLookup,
      wordStoreApi,
      applyRecord,
      executeLookup,
      setLoading,
      setStreamText,
      setActiveView,
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
      resetDictionaryHomeState();
      setText("");
    }
  }, [user, resetDictionaryHomeState]);

  const isEntryViewActive = isDictionaryViewActive;
  const resolvedTerm = activeTerm;
  const hasResolvedEntry = isEntryViewActive && Boolean(entry);
  const isTermActionable = isEntryViewActive && Boolean(resolvedTerm);
  const isEmptyStateActive = useMemo(
    () =>
      isDictionaryViewActive && !entry && !finalText && !streamText && !loading,
    [isDictionaryViewActive, entry, finalText, streamText, loading],
  );
  const displayClassName = useMemo(
    () =>
      ["display", isEmptyStateActive ? "display-empty" : ""]
        .filter(Boolean)
        .join(" "),
    [isEmptyStateActive],
  );

  const isCopySuccessActive =
    copyFeedbackState === COPY_FEEDBACK_STATES.SUCCESS;

  const dictionaryActionBarProps = useMemo(
    () => ({
      term: resolvedTerm,
      lang,
      onReoutput: handleReoutput,
      disabled: !isTermActionable || loading,
      versions: isEntryViewActive ? versions : [],
      activeVersionId: isEntryViewActive ? activeVersionId : null,
      onNavigate: isEntryViewActive ? handleNavigateVersion : undefined,
      onCopy: handleCopy,
      canCopy: canCopyDefinition,
      copyFeedbackState,
      isCopySuccess: isCopySuccessActive,
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
      copyFeedbackState,
      isCopySuccessActive,
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
    handleShowDictionary,
    handleShowLibrary,
    handleSelectHistory,
    favorites,
    activeView,
    viewState: {
      active: activeView,
      isDictionary: isDictionaryViewActive,
      isHistory: isHistoryViewActive,
      isLibrary: isLibraryViewActive,
    },
    focusInput,
    entry,
    finalText,
    streamText,
    loading,
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
    libraryLandingLabel,
    dictionaryTargetLanguageLabel: t.dictionaryTargetLanguageLabel,
    dictionarySourceLanguageLabel: t.dictionarySourceLanguageLabel,
    dictionarySwapLanguagesLabel: t.dictionarySwapLanguages,
    searchEmptyState: {
      title: t.searchEmptyTitle,
      description: t.searchEmptyDescription,
    },
    chatInputPlaceholder: t.inputPlaceholder,
  };
}
