import { useCallback, useMemo, useReducer } from "react";
import { useApi } from "@shared/hooks/useApi.js";
import { useUser } from "@core/context";
import {
  DEFAULT_WORD_REPORT_CATEGORY,
  WORD_REPORT_CATEGORIES,
} from "../reportCategories.js";


const initialState = Object.freeze({
  open: false,
  submitting: false,
  error: null,
  context: null,
  form: Object.freeze({
    category: DEFAULT_WORD_REPORT_CATEGORY,
    description: "",
  }),
});

const ACTIONS = Object.freeze({
  OPEN: "open",
  CLOSE: "close",
  CHANGE_CATEGORY: "change-category",
  CHANGE_DESCRIPTION: "change-description",
  SUBMIT_START: "submit-start",
  SUBMIT_SUCCESS: "submit-success",
  SUBMIT_FAILURE: "submit-failure",
});

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.OPEN:
      return {
        open: true,
        submitting: false,
        error: null,
        context: action.payload,
        form: {
          category: DEFAULT_WORD_REPORT_CATEGORY,
          description: "",
        },
      };
    case ACTIONS.CLOSE:
      return { ...state, open: false, submitting: false };
    case ACTIONS.CHANGE_CATEGORY:
      return {
        ...state,
        form: { ...state.form, category: action.payload },
      };
    case ACTIONS.CHANGE_DESCRIPTION:
      return {
        ...state,
        form: { ...state.form, description: action.payload },
      };
    case ACTIONS.SUBMIT_START:
      return { ...state, submitting: true, error: null };
    case ACTIONS.SUBMIT_SUCCESS:
      return {
        open: false,
        submitting: false,
        error: null,
        context: null,
        form: {
          category: DEFAULT_WORD_REPORT_CATEGORY,
          description: "",
        },
      };
    case ACTIONS.SUBMIT_FAILURE:
      return { ...state, submitting: false, error: action.payload };
    default:
      return state;
  }
}

export function useWordIssueReportDialog({ onSuccess, onError } = {}) {
  const api = useApi();
  const { user } = useUser();
  const [state, dispatch] = useReducer(reducer, initialState);

  const categories = useMemo(() => WORD_REPORT_CATEGORIES, []);

  const openDialog = useCallback((context) => {
    if (!context?.term) {
      return;
    }
    dispatch({ type: ACTIONS.OPEN, payload: context });
  }, []);

  const closeDialog = useCallback(() => {
    dispatch({ type: ACTIONS.CLOSE });
  }, []);

  const setCategory = useCallback((category) => {
    dispatch({ type: ACTIONS.CHANGE_CATEGORY, payload: category });
  }, []);

  const setDescription = useCallback((description) => {
    dispatch({ type: ACTIONS.CHANGE_DESCRIPTION, payload: description });
  }, []);

  const submit = useCallback(async () => {
    if (!state.open || state.submitting) {
      return;
    }
    if (!state.context) {
      return;
    }
    dispatch({ type: ACTIONS.SUBMIT_START });
    try {
      const payload = {
        term: state.context.term,
        language: state.context.language,
        flavor: state.context.flavor,
        category: state.form.category,
        description: state.form.description,
        sourceUrl: state.context.sourceUrl,
      };
      const response = await api.wordReports.submitWordReport({
        ...payload,
        token: user?.token,
      });
      dispatch({ type: ACTIONS.SUBMIT_SUCCESS });
      onSuccess?.(response);
    } catch (error) {
      const message = error?.message || "REPORT_SUBMIT_FAILED";
      dispatch({ type: ACTIONS.SUBMIT_FAILURE, payload: message });
      onError?.(error);
    }
  }, [api.wordReports, onError, onSuccess, state, user?.token]);

  return {
    state,
    categories,
    openDialog,
    closeDialog,
    setCategory,
    setDescription,
    submit,
  };
}
