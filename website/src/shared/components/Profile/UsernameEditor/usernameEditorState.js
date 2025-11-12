export const UsernameEditorModes = Object.freeze({
  VIEW: "view",
  EDIT: "edit",
  SAVING: "saving",
});

export const UsernameEditorActions = Object.freeze({
  SYNC_VALUE: "SYNC_VALUE",
  START_EDIT: "START_EDIT",
  CHANGE: "CHANGE",
  SUBMIT_START: "SUBMIT_START",
  SUBMIT_SUCCESS: "SUBMIT_SUCCESS",
  SUBMIT_FAILURE: "SUBMIT_FAILURE",
  CANCEL_EDIT: "CANCEL_EDIT",
});

/**
 * 意图：基于外部传入的用户名构造状态机初始状态。
 * 输入：username —— 可能为 undefined/null/空字符串；
 * 输出：包含模式、展示值、草稿值与错误信息的状态对象；
 * 流程：
 *  1) 兜底 username 为安全字符串；
 *  2) 默认模式为 VIEW，草稿与展示值保持一致；
 *  3) 初始化时清空错误信息，保证纯净起点。
 */
export function createUsernameEditorInitialState(username = "") {
  const safeValue = username ?? "";
  return {
    mode: UsernameEditorModes.VIEW,
    value: safeValue,
    draft: safeValue,
    error: null,
  };
}

/**
 * 意图：处理用户名编辑状态机的动作转移。
 * 输入：state —— 当前位置状态；action —— { type, ...payload }；
 * 输出：新的状态对象；
 * 复杂度：O(1)，仅根据动作类型做有限分支。
 */
export function usernameEditorReducer(state, action) {
  const handler = usernameEditorTransitions[action.type];
  return handler ? handler(state, action) : state;
}

const identity = (value) => value;

function createTransition({ guard = () => true, normalize = identity, apply }) {
  return (state, action) => {
    if (!guard(state, action)) {
      return state;
    }
    const payload = normalize(state, action);
    return apply(state, payload, action);
  };
}

const usernameEditorTransitions = {
  [UsernameEditorActions.SYNC_VALUE]: createTransition({
    guard: (state) => state.mode === UsernameEditorModes.VIEW,
    normalize: (_, action) => action.value ?? "",
    apply: (state, nextValue) =>
      nextValue === state.value
        ? state
        : { ...state, value: nextValue, draft: nextValue },
  }),
  [UsernameEditorActions.START_EDIT]: createTransition({
    guard: (state) => state.mode !== UsernameEditorModes.SAVING,
    apply: (state) => ({
      ...state,
      mode: UsernameEditorModes.EDIT,
      draft: state.value,
      error: null,
    }),
  }),
  [UsernameEditorActions.CHANGE]: createTransition({
    guard: (state) => state.mode !== UsernameEditorModes.VIEW,
    normalize: (_, action) => action.value ?? "",
    apply: (state, draft) => ({ ...state, draft, error: null }),
  }),
  [UsernameEditorActions.CANCEL_EDIT]: createTransition({
    guard: (state) => state.mode === UsernameEditorModes.EDIT,
    apply: (state) => ({
      ...state,
      mode: UsernameEditorModes.VIEW,
      draft: state.value,
      error: null,
    }),
  }),
  [UsernameEditorActions.SUBMIT_START]: createTransition({
    apply: (state) => ({
      ...state,
      mode: UsernameEditorModes.SAVING,
      error: null,
    }),
  }),
  [UsernameEditorActions.SUBMIT_SUCCESS]: createTransition({
    normalize: (_, action) => action.value ?? "",
    apply: (_, nextValue) => ({
      mode: UsernameEditorModes.VIEW,
      value: nextValue,
      draft: nextValue,
      error: null,
    }),
  }),
  [UsernameEditorActions.SUBMIT_FAILURE]: createTransition({
    normalize: (_, action) => action.error ?? null,
    apply: (state, error) => ({
      ...state,
      mode: UsernameEditorModes.EDIT,
      error,
    }),
  }),
};
