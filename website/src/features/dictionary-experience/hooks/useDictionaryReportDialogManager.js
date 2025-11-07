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
