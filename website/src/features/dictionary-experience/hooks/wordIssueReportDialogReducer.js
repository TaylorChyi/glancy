import { DEFAULT_WORD_REPORT_CATEGORY } from "../reportCategories.js";

export const ACTIONS = Object.freeze({
  OPEN: "open",
  CLOSE: "close",
  CHANGE_CATEGORY: "change-category",
  CHANGE_DESCRIPTION: "change-description",
  SUBMIT_START: "submit-start",
  SUBMIT_SUCCESS: "submit-success",
  SUBMIT_FAILURE: "submit-failure",
});

const createDefaultFormState = () => ({
  category: DEFAULT_WORD_REPORT_CATEGORY,
  description: "",
});

const frozenInitialFormState = Object.freeze(createDefaultFormState());

export const initialState = Object.freeze({
  open: false,
  submitting: false,
  error: null,
  context: null,
  form: frozenInitialFormState,
});

function handleOpen(_, context) {
  return {
    open: true,
    submitting: false,
    error: null,
    context,
    form: createDefaultFormState(),
  };
}

function handleClose(state) {
  return { ...state, open: false, submitting: false };
}

function handleChangeCategory(state, category) {
  return {
    ...state,
    form: { ...state.form, category },
  };
}

function handleChangeDescription(state, description) {
  return {
    ...state,
    form: { ...state.form, description },
  };
}

function handleSubmitStart(state) {
  return { ...state, submitting: true, error: null };
}

function handleSubmitSuccess() {
  return {
    open: false,
    submitting: false,
    error: null,
    context: null,
    form: createDefaultFormState(),
  };
}

function handleSubmitFailure(state, error) {
  return { ...state, submitting: false, error };
}

const reducerMap = {
  [ACTIONS.OPEN]: handleOpen,
  [ACTIONS.CLOSE]: handleClose,
  [ACTIONS.CHANGE_CATEGORY]: handleChangeCategory,
  [ACTIONS.CHANGE_DESCRIPTION]: handleChangeDescription,
  [ACTIONS.SUBMIT_START]: handleSubmitStart,
  [ACTIONS.SUBMIT_SUCCESS]: handleSubmitSuccess,
  [ACTIONS.SUBMIT_FAILURE]: handleSubmitFailure,
};

export function wordIssueReportDialogReducer(state, action) {
  const handler = reducerMap[action.type];
  if (!handler) {
    return state;
  }
  return handler(state, action.payload);
}
