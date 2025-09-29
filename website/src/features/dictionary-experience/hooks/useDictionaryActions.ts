import { useCallback, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useSpeechInput, useAppShortcuts } from "@/hooks";
import { copyTextToClipboard } from "@/utils";
import { REPORT_FORM_URL, SUPPORT_EMAIL } from "@/config";
import {
  attemptDictionaryShare,
  buildCopyPayload,
  buildReportTarget,
  type DictionaryEntry,
} from "../services/dictionaryExperienceService";

export type DictionaryActionsParams = {
  t: Record<string, any>;
  lang: string;
  setLang: (value: string) => void;
  theme: string;
  setTheme: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  entry: DictionaryEntry;
  finalText: string;
  streamText: string;
  currentTerm: string;
  favorites: string[];
  toggleFavorite: (term: string) => void;
  showFavorites: boolean;
  showHistory: boolean;
  setText: (value: string) => void;
  onDeleteHistory: () => Promise<void>;
  onReoutput: () => void;
  onNavigateVersion: (direction: "next" | "prev") => void;
  versions: any[];
  activeVersionId: string | number | null;
  isEntryViewActive: boolean;
  loading: boolean;
  showPopup: (message: string) => void;
  user: any;
  unfavoriteHistory: (term: string, user: any) => void;
};

export function useDictionaryActions({
  t,
  lang,
  setLang,
  theme,
  setTheme,
  inputRef,
  entry,
  finalText,
  streamText,
  currentTerm,
  favorites,
  toggleFavorite,
  showFavorites,
  showHistory,
  setText,
  onDeleteHistory,
  onReoutput,
  onNavigateVersion,
  versions,
  activeVersionId,
  isEntryViewActive,
  loading,
  showPopup,
  user,
  unfavoriteHistory,
}: DictionaryActionsParams) {
  const activeTerm = entry?.term || currentTerm;
  const { start: startSpeech } = useSpeechInput({ onResult: setText });
  const windowOriginRef = useRef<string | null>(
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : null,
  );

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

  const copyPayload = useMemo(
    () =>
      buildCopyPayload({
        entry,
        finalText,
        streamText,
        fallbackTerm: currentTerm || "",
      }),
    [entry, finalText, streamText, currentTerm],
  );

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

  const handleVoice = useCallback(() => {
    const locale = lang === "en" ? "en-US" : "zh-CN";
    startSpeech(locale);
  }, [lang, startSpeech]);

  const handleShare = useCallback(async () => {
    if (!activeTerm) return;
    const currentUrl =
      typeof window !== "undefined" && window.location
        ? window.location.href
        : "";

    const result = await attemptDictionaryShare({
      term: activeTerm,
      template: t.shareMessage,
      currentUrl,
    });

    if (result.status === "shared") {
      showPopup(t.shareSuccess ?? t.share ?? activeTerm);
      return;
    }
    if (result.status === "copied") {
      showPopup(t.shareCopySuccess ?? t.shareSuccess ?? activeTerm);
      return;
    }
    if (result.status === "aborted") {
      return;
    }
    showPopup(t.shareFailed ?? t.share ?? activeTerm);
  }, [
    activeTerm,
    t.shareMessage,
    t.shareSuccess,
    t.share,
    t.shareCopySuccess,
    t.shareFailed,
    showPopup,
  ]);

  const handleReport = useCallback(() => {
    if (!activeTerm) return;
    const currentUrl =
      typeof window !== "undefined" && window.location
        ? window.location.href
        : "";

    const target = buildReportTarget({
      reportFormUrl: REPORT_FORM_URL,
      supportEmail: SUPPORT_EMAIL,
      term: activeTerm,
      currentUrl,
      windowOriginRef,
    });

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
    windowOriginRef,
    showPopup,
    t.reportUnavailable,
    t.reportFailed,
    t.report,
    t.reportSuccess,
  ]);

  const handleUnfavorite = useCallback(
    (term: string) => {
      unfavoriteHistory(term, user);
      toggleFavorite(term);
    },
    [unfavoriteHistory, user, toggleFavorite],
  );

  const hasResolvedEntry = isEntryViewActive && Boolean(entry);
  const resolvedTerm = activeTerm;
  const isTermActionable = isEntryViewActive && Boolean(resolvedTerm);

  const dictionaryActionBarProps = useMemo(
    () => ({
      visible: hasResolvedEntry,
      term: resolvedTerm,
      lang,
      onReoutput,
      disabled: !isTermActionable || loading,
      versions: isEntryViewActive ? versions : [],
      activeVersionId: isEntryViewActive ? activeVersionId : null,
      onNavigate: isEntryViewActive ? onNavigateVersion : undefined,
      onCopy: handleCopy,
      canCopy: canCopyDefinition,
      favorited: Boolean(resolvedTerm && favorites.includes(resolvedTerm)),
      onToggleFavorite: toggleFavoriteEntry,
      canFavorite: hasResolvedEntry && isTermActionable,
      canDelete: isTermActionable,
      onDelete: isEntryViewActive ? onDeleteHistory : undefined,
      canShare: isTermActionable,
      onShare: isEntryViewActive ? handleShare : undefined,
      canReport: isTermActionable,
      onReport: isEntryViewActive ? handleReport : undefined,
    }),
    [
      hasResolvedEntry,
      resolvedTerm,
      lang,
      onReoutput,
      isTermActionable,
      loading,
      isEntryViewActive,
      versions,
      activeVersionId,
      onNavigateVersion,
      handleCopy,
      canCopyDefinition,
      favorites,
      toggleFavoriteEntry,
      onDeleteHistory,
      handleShare,
      handleReport,
    ],
  );

  return {
    favorites,
    canCopyDefinition,
    handleCopy,
    handleShare,
    handleReport,
    handleVoice,
    handleUnfavorite,
    dictionaryActionBarProps,
    toggleFavoriteEntry,
  };
}
