/**
 * 背景：
 *  - 偏好设置的“个性画像”分区已无法满足响应风格定制需求，需转型为可编辑的响应语气配置。
 * 目的：
 *  - 以 reducer 维护响应风格表单的加载/保存状态，并提供纯函数适配器在后端档案模型与前端控件之间转换。
 * 关键决策与取舍：
 *  - 采用“适配器 + 状态机”组合：适配器负责字段清洗，reducer 管理字段编辑与保存状态，确保逻辑集中且便于单元测试；
 *  - 放弃在组件内直接维护 useState，避免在多字段保存时状态散落导致竞态；
 *  - 保留字段列表常量，后续新增字段时仅需在此处扩展即可影响全部派生流程。
 * 影响范围：
 *  - Preferences 页面响应风格分区及其调用的保存流程。
 * 演进与TODO：
 *  - TODO: 后续可引入保存节流与批量提交策略，减少频繁 API 调用。
 */

import { createEmptyProfileDetails } from "@/pages/profile/profileDetailsModel.js";

const RESPONSE_STYLE_FIELDS = Object.freeze([
  "responseStyle",
  "goal",
  "job",
  "education",
  "interests",
  "currentAbility",
]);

const sanitizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

const createDraft = (seed = createEmptyProfileDetails()) => {
  const draft = {};
  for (const field of RESPONSE_STYLE_FIELDS) {
    draft[field] = sanitizeText(seed[field]);
  }
  if (!draft.responseStyle) {
    draft.responseStyle = "default";
  }
  return draft;
};

export const RESPONSE_STYLE_INITIAL_STATE = Object.freeze({
  status: "idle",
  values: Object.freeze(createDraft()),
  persisted: Object.freeze(createDraft()),
  savingField: null,
  error: null,
});

export const RESPONSE_STYLE_ACTIONS = Object.freeze({
  loading: "loading",
  hydrate: "hydrate",
  change: "change",
  saving: "saving",
  success: "success",
  failure: "failure",
  synchronize: "synchronize",
  clearError: "clearError",
});

/**
 * 意图：集中管理响应风格分区的状态流转。
 * 输入：状态对象与动作（type + payload）。
 * 输出：新的状态对象。
 * 流程：根据动作类别切换加载、编辑、保存或错误态。
 * 错误处理：未知动作直接返回原状态。
 * 复杂度：O(1)。
 */
export function responseStyleReducer(state, action) {
  switch (action.type) {
    case RESPONSE_STYLE_ACTIONS.hydrate: {
      const nextDraft = Object.freeze(createDraft(action.payload));
      return {
        status: "ready",
        values: nextDraft,
        persisted: nextDraft,
        savingField: null,
        error: null,
      };
    }
    case RESPONSE_STYLE_ACTIONS.loading: {
      return {
        ...state,
        status: "loading",
        savingField: null,
      };
    }
    case RESPONSE_STYLE_ACTIONS.change: {
      if (!RESPONSE_STYLE_FIELDS.includes(action.field)) {
        return state;
      }
      const nextValues = { ...state.values, [action.field]: action.value };
      return { ...state, values: nextValues };
    }
    case RESPONSE_STYLE_ACTIONS.synchronize: {
      if (!RESPONSE_STYLE_FIELDS.includes(action.field)) {
        return state;
      }
      const normalized = sanitizeText(action.value);
      const nextValues = { ...state.values, [action.field]: normalized };
      const nextPersisted = { ...state.persisted, [action.field]: normalized };
      return {
        ...state,
        status: "ready",
        values: nextValues,
        persisted: nextPersisted,
        savingField: null,
        error: null,
      };
    }
    case RESPONSE_STYLE_ACTIONS.saving: {
      return {
        ...state,
        status: "saving",
        savingField: action.field,
        error: null,
      };
    }
    case RESPONSE_STYLE_ACTIONS.success: {
      const nextDraft = Object.freeze(createDraft(action.payload));
      return {
        status: "ready",
        values: nextDraft,
        persisted: nextDraft,
        savingField: null,
        error: null,
      };
    }
    case RESPONSE_STYLE_ACTIONS.failure: {
      return {
        ...state,
        status: "error",
        savingField: null,
        error: action.error,
      };
    }
    case RESPONSE_STYLE_ACTIONS.clearError: {
      if (!state.error) {
        return state;
      }
      return { ...state, error: null };
    }
    default:
      return state;
  }
}

export function hasFieldChanged(state, field) {
  if (!state || !RESPONSE_STYLE_FIELDS.includes(field)) {
    return false;
  }
  const nextValue = sanitizeText(state.values[field]);
  const persistedValue = sanitizeText(state.persisted[field]);
  return nextValue !== persistedValue;
}

export function buildRequestPayload(state, baseDetails) {
  const merged = { ...baseDetails };
  for (const field of RESPONSE_STYLE_FIELDS) {
    merged[field] = sanitizeText(state.values[field]);
  }
  return merged;
}

export function createResponseStyleInitialState() {
  return { ...RESPONSE_STYLE_INITIAL_STATE };
}

export { RESPONSE_STYLE_FIELDS };
