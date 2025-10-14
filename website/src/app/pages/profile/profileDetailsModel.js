/**
 * 背景：
 *  - Profile 页面先前直接在组件内维护分散的状态与 API 映射，扩展新字段时容易遗漏序列化逻辑。
 * 目的：
 *  - 提供纯函数模型以创建/转换个性化详情页的表单状态，集中定义核心字段与自定义大项的序列化策略。
 * 关键决策与取舍：
 *  - 采用 reducer + 配置驱动的模型，便于未来通过配置扩展字段；序列化过程中过滤空值以减轻后端存储负担。
 * 影响范围：
 *  - Profile 页面与其测试将复用这些函数，避免在 UI 层散落数据转换逻辑。
 * 演进与TODO：
 *  - TODO: 若后续支持服务端下发表单结构，可在此增加 schema 解析能力。
 */

export const CORE_FIELDS = [
  "job",
  "education",
  "interests",
  "goal",
  "currentAbility",
  "responseStyle",
];

export function createLocalId(prefix = "profile") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  const random = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now()}-${random}`;
}

export function createCustomItem(partial = {}) {
  return {
    id: partial.id ?? createLocalId("profile-item"),
    label: partial.label ?? "",
    value: partial.value ?? "",
  };
}

export function createCustomSection(partial = {}) {
  const items = (partial.items ?? []).map((item) => createCustomItem(item));
  return {
    id: partial.id ?? createLocalId("profile-section"),
    title: partial.title ?? "",
    items: items.length > 0 ? items : [createCustomItem()],
  };
}

export function createEmptyProfileDetails() {
  return {
    job: "",
    education: "",
    interests: "",
    goal: "",
    currentAbility: "",
    responseStyle: "",
    customSections: [],
  };
}

export function profileDetailsReducer(state, action) {
  switch (action.type) {
    case "hydrate": {
      return {
        ...state,
        ...action.payload,
      };
    }
    case "updateField": {
      if (!CORE_FIELDS.includes(action.field)) {
        return state;
      }
      return {
        ...state,
        [action.field]: action.value,
      };
    }
    case "setCustomSections": {
      return {
        ...state,
        customSections: action.sections.map((section) =>
          createCustomSection(section),
        ),
      };
    }
    default:
      return state;
  }
}

export function mapResponseToProfileDetails(response) {
  if (!response) {
    return createEmptyProfileDetails();
  }
  const base = createEmptyProfileDetails();
  return {
    ...base,
    job: response.job ?? "",
    education: response.education ?? "",
    interests: response.interest ?? "",
    goal: response.goal ?? "",
    currentAbility: response.currentAbility ?? "",
    responseStyle: response.responseStyle ?? "",
    customSections: (response.customSections ?? []).map((section) =>
      createCustomSection({
        title: section.title,
        items: (section.items ?? []).map((item) => ({
          label: item.label,
          value: item.value,
        })),
      }),
    ),
  };
}

function sanitizeText(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed;
}

export function mapProfileDetailsToRequest(details) {
  const normalized = {
    job: sanitizeText(details.job),
    interest: sanitizeText(details.interests),
    goal: sanitizeText(details.goal),
    education: sanitizeText(details.education),
    currentAbility: sanitizeText(details.currentAbility),
    responseStyle: sanitizeText(details.responseStyle),
    customSections: (details.customSections ?? [])
      .map((section) => {
        const title = sanitizeText(section.title);
        const items = (section.items ?? [])
          .map((item) => ({
            label: sanitizeText(item.label),
            value: sanitizeText(item.value),
          }))
          .filter((item) => item.label || item.value);
        if (!title && items.length === 0) {
          return null;
        }
        return {
          title,
          items,
        };
      })
      .filter(Boolean),
  };

  return {
    job: normalized.job || null,
    interest: normalized.interest || null,
    goal: normalized.goal || null,
    education: normalized.education || null,
    currentAbility: normalized.currentAbility || null,
    responseStyle: normalized.responseStyle || null,
    customSections: normalized.customSections,
  };
}
