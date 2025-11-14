import { useMemo } from "react";

export type UseDictionaryReportingPropsArgs = {
  reportDialog: Record<string, any>;
  reportDialogHandlers: Record<string, any>;
  popupConfig: Record<string, any> | undefined;
  toast?:
    | undefined
    | {
        open: boolean;
        message: string;
        duration?: number;
        backgroundColor?: string;
        textColor?: string;
        closeLabel?: string;
      };
  closeToast: (() => void) | undefined;
};

type CreateDictionaryReportingPropsArgs = UseDictionaryReportingPropsArgs;

type ReportPanelBuilderArgs = Pick<
  CreateDictionaryReportingPropsArgs,
  "reportDialog" | "reportDialogHandlers"
>;

const buildReportPanelProps = ({
  reportDialog,
  reportDialogHandlers,
}: ReportPanelBuilderArgs) => ({
  open: reportDialog.open,
  term: reportDialog.term,
  language: reportDialog.language,
  flavor: reportDialog.flavor,
  sourceLanguage: reportDialog.sourceLanguage,
  targetLanguage: reportDialog.targetLanguage,
  category: reportDialog.category,
  categories: reportDialog.categories ?? [],
  description: reportDialog.description,
  submitting: reportDialog.submitting,
  error: reportDialog.error ?? "",
  onClose: reportDialogHandlers.close,
  onCategoryChange: reportDialogHandlers.setCategory,
  onDescriptionChange: reportDialogHandlers.setDescription,
  onSubmit: reportDialogHandlers.submit,
});

type ToastBuilderArgs = Pick<
  CreateDictionaryReportingPropsArgs,
  "toast" | "closeToast"
>;

const buildToastProps = ({ toast, closeToast }: ToastBuilderArgs) =>
  toast
    ? {
        open: toast.open,
        message: toast.message,
        duration: toast.duration,
        backgroundColor: toast.backgroundColor,
        textColor: toast.textColor,
        closeLabel: toast.closeLabel,
        onClose: closeToast,
      }
    : undefined;

export const createDictionaryReportingProps = ({
  reportDialog,
  reportDialogHandlers,
  popupConfig,
  toast,
  closeToast,
}: CreateDictionaryReportingPropsArgs) => ({
  reportPanel: buildReportPanelProps({ reportDialog, reportDialogHandlers }),
  feedbackHub: {
    popup: popupConfig,
    toast: buildToastProps({ toast, closeToast }),
  },
});

export const useDictionaryReportingProps = ({
  reportDialog,
  reportDialogHandlers,
  popupConfig,
  toast,
  closeToast,
}: UseDictionaryReportingPropsArgs) =>
  useMemo(
    () =>
      createDictionaryReportingProps({
        reportDialog,
        reportDialogHandlers,
        popupConfig,
        toast,
        closeToast,
      }),
    [closeToast, popupConfig, reportDialog, reportDialogHandlers, toast],
  );

export default useDictionaryReportingProps;
