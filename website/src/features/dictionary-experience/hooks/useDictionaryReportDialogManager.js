import { useMemo, useCallback } from "react";
import { resolveDictionaryConfig } from "@shared/utils";
import { useWordIssueReportDialog } from "./useWordIssueReportDialog.js";

const resolveReportMessage = (primary, fallback) =>
  primary ?? fallback ?? "Report";

const buildReportDialog = (state, categories) => {
  const context = state.context ?? {};
  return {
    open: state.open,
    submitting: state.submitting,
    error: state.error,
    term: context.term ?? "",
    language: context.language ?? null,
    flavor: context.flavor ?? null,
    sourceLanguage: context.sourceLanguage ?? null,
    targetLanguage: context.targetLanguage ?? null,
    sourceUrl: context.sourceUrl ?? "",
    category: state.form.category,
    description: state.form.description,
    categories,
  };
};

const useReportDialogState = ({ t, showToast, showPopup }) => {
  const dialog = useWordIssueReportDialog({
    onSuccess: () => showToast(resolveReportMessage(t.reportSuccess, t.report)),
    onError: () => showPopup(resolveReportMessage(t.reportFailed, t.report)),
  });
  const reportDialog = useMemo(
    () => buildReportDialog(dialog.state, dialog.categories),
    [dialog.state, dialog.categories],
  );
  return { dialog, reportDialog };
};

const useReportDialogHandlers = (dialog) =>
  useMemo(
    () => ({
      setCategory: dialog.setCategory,
      setDescription: dialog.setDescription,
      submit: dialog.submit,
      close: dialog.closeDialog,
    }),
    [dialog.setCategory, dialog.setDescription, dialog.submit, dialog.closeDialog],
  );

const resolveReportContext = ({
  activeTerm,
  entry,
  dictionaryFlavor,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
}) => {
  const fallback = resolveDictionaryConfig(activeTerm, {
    sourceLanguage: dictionarySourceLanguage,
    targetLanguage: dictionaryTargetLanguage,
  });

  return {
    term: activeTerm,
    language: entry?.language ?? fallback.language,
    flavor: entry?.flavor ?? dictionaryFlavor,
    sourceLanguage: dictionarySourceLanguage,
    targetLanguage: dictionaryTargetLanguage,
    sourceUrl:
      typeof window !== "undefined" && window.location
        ? window.location.href
        : "",
  };
};

const useReportHandler = ({
  activeTerm,
  entry,
  dictionaryFlavor,
  dictionarySourceLanguage,
  dictionaryTargetLanguage,
  openReportDialog,
}) =>
  useCallback(() => {
    if (!activeTerm) return;
    const payload = resolveReportContext({
      activeTerm,
      entry,
      dictionaryFlavor,
      dictionarySourceLanguage,
      dictionaryTargetLanguage,
    });
    openReportDialog(payload);
  }, [
    activeTerm,
    entry,
    dictionaryFlavor,
    dictionarySourceLanguage,
    dictionaryTargetLanguage,
    openReportDialog,
  ]);

export function useDictionaryReportDialogManager(config) {
  const { dialog, reportDialog } = useReportDialogState(config);
  const reportDialogHandlers = useReportDialogHandlers(dialog);
  const handleReport = useReportHandler({
    ...config,
    openReportDialog: dialog.openDialog,
  });

  return {
    reportDialog,
    reportDialogHandlers,
    handleReport,
    closeReportDialog: dialog.closeDialog,
  };
}
