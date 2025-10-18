/**
 * 背景：
 *  - 举报弹窗的状态映射与触发逻辑分散在主 Hook，增加维护复杂度。
 * 目的：
 *  - 提供聚合的举报弹窗门面，集中管理文案、上下文与触发动作。
 * 关键决策与取舍：
 *  - 在此内部调用 useWordIssueReportDialog，并输出 ViewModel 以解耦主 Hook；
 *  - 将 handleReport 与弹窗状态放在一起，确保调用方只需关注 activeTerm 等少量参数。
 * 影响范围：
 *  - DictionaryExperience 举报入口；未来若需复用可直接引用该 Hook。
 * 演进与TODO：
 *  - 后续可在此扩展埋点或错误追踪能力。
 */
import { useMemo, useCallback } from "react";
import { resolveDictionaryConfig } from "@shared/utils";
import { useWordIssueReportDialog } from "./useWordIssueReportDialog.js";

export function useDictionaryReportDialogManager({
  t,
  showToast,
  showPopup,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  dictionaryFlavor,
  entry,
  activeTerm,
}) {
  const {
    state: reportDialogState,
    categories: reportDialogCategories,
    openDialog: openReportDialog,
    closeDialog: closeReportDialog,
    setCategory: setReportCategory,
    setDescription: setReportDescription,
    submit: submitWordIssueReport,
  } = useWordIssueReportDialog({
    onSuccess: () => {
      const message = t.reportSuccess ?? t.report ?? "Report";
      showToast(message);
    },
    onError: () => {
      const message = t.reportFailed ?? t.report ?? "Report";
      showPopup(message);
    },
  });

  const reportDialog = useMemo(() => {
    const context = reportDialogState.context ?? {};
    return {
      open: reportDialogState.open,
      submitting: reportDialogState.submitting,
      error: reportDialogState.error,
      term: context.term ?? "",
      language: context.language ?? null,
      flavor: context.flavor ?? null,
      sourceLanguage: context.sourceLanguage ?? null,
      targetLanguage: context.targetLanguage ?? null,
      sourceUrl: context.sourceUrl ?? "",
      category: reportDialogState.form.category,
      description: reportDialogState.form.description,
      categories: reportDialogCategories,
    };
  }, [reportDialogState, reportDialogCategories]);

  const reportDialogHandlers = useMemo(
    () => ({
      setCategory: setReportCategory,
      setDescription: setReportDescription,
      submit: submitWordIssueReport,
      close: closeReportDialog,
    }),
    [
      setReportCategory,
      setReportDescription,
      submitWordIssueReport,
      closeReportDialog,
    ],
  );

  const handleReport = useCallback(() => {
    if (!activeTerm) return;

    const fallback = resolveDictionaryConfig(activeTerm, {
      sourceLanguage: dictionarySourceLanguage,
      targetLanguage: dictionaryTargetLanguage,
    });

    const contextLanguage = entry?.language ?? fallback.language;
    const contextFlavor = entry?.flavor ?? dictionaryFlavor;
    const sourceUrl =
      typeof window !== "undefined" && window.location
        ? window.location.href
        : "";

    openReportDialog({
      term: activeTerm,
      language: contextLanguage,
      flavor: contextFlavor,
      sourceLanguage: dictionarySourceLanguage,
      targetLanguage: dictionaryTargetLanguage,
      sourceUrl,
    });
  }, [
    activeTerm,
    entry,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    dictionaryFlavor,
    openReportDialog,
  ]);

  return {
    reportDialog,
    reportDialogHandlers,
    handleReport,
    closeReportDialog,
  };
}
