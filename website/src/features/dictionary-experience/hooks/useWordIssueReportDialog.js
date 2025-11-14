import { useCallback, useMemo, useReducer } from "react";
import { useApi } from "@shared/hooks/useApi.js";
import { useUser } from "@core/context";
import {
  DEFAULT_WORD_REPORT_CATEGORY,
  WORD_REPORT_CATEGORIES,
} from "../reportCategories.js";
import {
  ACTIONS,
  initialState,
  wordIssueReportDialogReducer,
} from "./wordIssueReportDialogReducer.js";

export function isValidReportContext(context) {
  return Boolean(context?.term);
}

export function canSubmitReport(state) {
  return Boolean(state?.open && !state?.submitting && state?.context);
}

export function buildReportPayload({ context, form }) {
  const {
    term = "",
    language = null,
    flavor = null,
    sourceUrl = "",
  } = context ?? {};
  const {
    category = DEFAULT_WORD_REPORT_CATEGORY,
    description = "",
  } = form ?? {};

  return { term, language, flavor, category, description, sourceUrl };
}

export function createReportActions(dispatch) {
  return {
    open: (context) => dispatch({ type: ACTIONS.OPEN, payload: context }),
    close: () => dispatch({ type: ACTIONS.CLOSE }),
    changeCategory: (category) =>
      dispatch({ type: ACTIONS.CHANGE_CATEGORY, payload: category }),
    changeDescription: (description) =>
      dispatch({ type: ACTIONS.CHANGE_DESCRIPTION, payload: description }),
    submitStart: () => dispatch({ type: ACTIONS.SUBMIT_START }),
    submitSuccess: () => dispatch({ type: ACTIONS.SUBMIT_SUCCESS }),
    submitFailure: (error) =>
      dispatch({ type: ACTIONS.SUBMIT_FAILURE, payload: error }),
  };
}

function useReportDialogState() {
  const [state, dispatch] = useReducer(
    wordIssueReportDialogReducer,
    initialState,
  );
  const actions = useMemo(() => createReportActions(dispatch), [dispatch]);
  return { state, actions };
}

function useOpenDialogHandler(openAction) {
  return useCallback(
    (context) => {
      if (isValidReportContext(context)) {
        openAction(context);
      }
    },
    [openAction],
  );
}

function useSubmitArguments(args) {
  const {
    state,
    submitWordReport,
    submitStart,
    submitSuccess,
    submitFailure,
    userToken,
    onSuccess,
    onError,
  } = args;
  return useMemo(
    () => ({
      state,
      submitWordReport,
      submitStart,
      submitSuccess,
      submitFailure,
      userToken,
      onSuccess,
      onError,
    }),
    [state, submitWordReport, submitStart, submitSuccess, submitFailure, userToken, onSuccess, onError],
  );
}

function useSubmitReportHandler(args) {
  return useCallback(() => executeSubmit(args), [args]);
}

async function executeSubmit({
  state,
  submitWordReport,
  submitStart,
  submitSuccess,
  submitFailure,
  userToken,
  onSuccess,
  onError,
}) {
  if (!canSubmitReport(state)) {
    return;
  }
  submitStart();
  try {
    const response = await persistReportRequest({
      state,
      submitWordReport,
      userToken,
    });
    submitSuccess();
    onSuccess?.(response);
  } catch (error) {
    const message = error?.message || "REPORT_SUBMIT_FAILED";
    submitFailure(message);
    onError?.(error);
  }
}

function persistReportRequest({ state, submitWordReport, userToken }) {
  const payload = buildReportPayload({
    context: state.context,
    form: state.form,
  });
  return submitWordReport({
    ...payload,
    token: userToken,
  });
}

export function useWordIssueReportDialog({ onSuccess, onError } = {}) {
  const api = useApi();
  const { user } = useUser();
  const { state, actions } = useReportDialogState();
  const categories = useMemo(() => WORD_REPORT_CATEGORIES, []);
  const openDialog = useOpenDialogHandler(actions.open);
  const submitArgs = useSubmitArguments({
    state,
    submitWordReport: api.wordReports.submitWordReport,
    submitStart: actions.submitStart,
    submitSuccess: actions.submitSuccess,
    submitFailure: actions.submitFailure,
    userToken: user?.token,
    onSuccess,
    onError,
  });
  const submit = useSubmitReportHandler(submitArgs);
  return {
    state,
    categories,
    openDialog,
    closeDialog: actions.close,
    setCategory: actions.changeCategory,
    setDescription: actions.changeDescription,
    submit,
  };
}
