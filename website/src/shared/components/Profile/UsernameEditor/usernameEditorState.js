/**
 * 背景：
 *  - UsernameEditor 先前直接在组件内部维护状态机常量与 reducer，使视图与控制逻辑纠缠在一起；
 *  - 随着 lint 迁移启用更严格的结构化规则，需要拆分状态处理单元，降低组件文件体量。
 * 目的：
 *  - 提供独立的状态机定义，集中描述用户名编辑流程的状态、动作与初始化策略；
 *  - 让视图层可以通过组合的方式复用状态机，便于未来扩展节流、远端校验等分支。
 * 关键决策与取舍：
 *  - 采用不可变常量导出状态、动作枚举，约束外部只读消费，避免魔法字符串散落；
 *  - 暴露纯函数 reducer 以支撑 React useReducer，在 hook 内组合额外副作用；
 *  - 初始化函数接收原始用户名并在此统一兜底，确保状态来源单一。
 * 影响范围：
 *  - Profile 用户名编辑相关的组件与测试；
 *  - 任何依赖状态机常量与 reducer 的新扩展逻辑。
 * 演进与TODO：
 *  - 后续若引入节流或远程校验，可在 reducer 中新增动作类型并保持向后兼容。
 */

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
  switch (action.type) {
    case UsernameEditorActions.SYNC_VALUE: {
      if (state.mode !== UsernameEditorModes.VIEW) return state;
      const nextValue = action.value ?? "";
      if (nextValue === state.value) return state;
      return { ...state, value: nextValue, draft: nextValue };
    }
    case UsernameEditorActions.START_EDIT:
      if (state.mode === UsernameEditorModes.SAVING) return state;
      return {
        ...state,
        mode: UsernameEditorModes.EDIT,
        draft: state.value,
        error: null,
      };
    case UsernameEditorActions.CHANGE:
      if (state.mode === UsernameEditorModes.VIEW) return state;
      return { ...state, draft: action.value, error: null };
    case UsernameEditorActions.CANCEL_EDIT:
      if (state.mode !== UsernameEditorModes.EDIT) return state;
      return {
        ...state,
        mode: UsernameEditorModes.VIEW,
        draft: state.value,
        error: null,
      };
    case UsernameEditorActions.SUBMIT_START:
      return { ...state, mode: UsernameEditorModes.SAVING, error: null };
    case UsernameEditorActions.SUBMIT_SUCCESS: {
      const nextValue = action.value ?? "";
      return {
        mode: UsernameEditorModes.VIEW,
        value: nextValue,
        draft: nextValue,
        error: null,
      };
    }
    case UsernameEditorActions.SUBMIT_FAILURE:
      return {
        ...state,
        mode: UsernameEditorModes.EDIT,
        error: action.error ?? null,
      };
    default:
      return state;
  }
}
