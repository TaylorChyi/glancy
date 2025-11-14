import { DEFAULT_WORD_REPORT_CATEGORY } from "../reportCategories.js";
import {
  ACTIONS,
  initialState,
  wordIssueReportDialogReducer,
} from "./wordIssueReportDialogReducer.js";

test("open action stores context and resets form", () => {
  const context = { term: "foo", language: "ENGLISH" };
  const state = wordIssueReportDialogReducer(initialState, {
    type: ACTIONS.OPEN,
    payload: context,
  });

  expect(state.open).toBe(true);
  expect(state.context).toEqual(context);
  expect(state.form).toEqual({
    category: DEFAULT_WORD_REPORT_CATEGORY,
    description: "",
  });
});

test("submit failure flags error and stops submitting", () => {
  const openState = wordIssueReportDialogReducer(initialState, {
    type: ACTIONS.OPEN,
    payload: { term: "bar" },
  });
  const submittingState = wordIssueReportDialogReducer(openState, {
    type: ACTIONS.SUBMIT_START,
  });

  const failedState = wordIssueReportDialogReducer(submittingState, {
    type: ACTIONS.SUBMIT_FAILURE,
    payload: "error",
  });

  expect(failedState.submitting).toBe(false);
  expect(failedState.error).toBe("error");
});
