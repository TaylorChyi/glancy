/**
 * 背景：
 *  - 偏好设置的个性化分区需要与 Profile 页面复用同一套字段语义，但视图模式与编辑模式的诉求不同。
 * 目的：
 *  - 提供纯函数模型以整理、格式化画像详情，并定义轻量状态机在不同加载阶段之间切换。
 * 关键决策与取舍：
 *  - 采用适配器模式：输入为 profileDetailsModel 的结果，输出为界面友好的只读快照；
 *  - 状态管理使用显式 reducer，避免在 hook 中散落多处 setState，便于未来扩展刷新与并发请求。
 * 影响范围：
 *  - Preferences 页面的个性化分区，以及对应的单元测试。
 * 演进与TODO：
 *  - TODO: 若后续支持多版本画像或差异比较，可在此扩展快照结构并注入版本元数据。
 */
import { createEmptyProfileDetails } from "@/pages/profile/profileDetailsModel.js";

const PERSONALIZATION_FIELD_BLUEPRINT = Object.freeze([
  {
    id: "job",
    sourceKey: "job",
    labelKey: "jobLabel",
    fallbackLabel: "Occupation",
  },
  {
    id: "education",
    sourceKey: "education",
    labelKey: "educationLabel",
    fallbackLabel: "Education",
  },
  {
    id: "interests",
    sourceKey: "interests",
    labelKey: "interestsLabel",
    fallbackLabel: "Interests",
  },
  {
    id: "goal",
    sourceKey: "goal",
    labelKey: "goalLabel",
    fallbackLabel: "Goal",
  },
  {
    id: "currentAbility",
    sourceKey: "currentAbility",
    labelKey: "currentAbilityLabel",
    fallbackLabel: "Current proficiency",
  },
]);

const sanitizeText = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  return trimmed;
};

const resolveLabel = (translations, labelKey, fallbackLabel) => {
  if (translations && typeof translations[labelKey] === "string") {
    return translations[labelKey];
  }
  return fallbackLabel;
};

const normalizeFallback = (candidate, fallbackValue) => {
  if (candidate && candidate.trim().length > 0) {
    return candidate;
  }
  return fallbackValue;
};

/**
 * 意图：
 *  - 根据画像详情与翻译词条生成只读快照，供个性化详情界面渲染。
 * 输入：
 *  - details: createEmptyProfileDetails 或其 hydrate 结果；
 *  - translations: 国际化词条；
 *  - fallbackValue: 空值占位文案。
 * 输出：
 *  - 包含字段数组、自定义维度与摘要的对象。
 * 复杂度：
 *  - 时间 O(n + m)，n 为核心字段数量，m 为自定义维度条目数。
 */
export function createPersonalizationSnapshot(
  details = createEmptyProfileDetails(),
  { translations = {}, fallbackValue = "—" } = {},
) {
  const resolvedFallback =
    typeof fallbackValue === "string" && fallbackValue.trim().length > 0
      ? fallbackValue.trim()
      : "—";

  const fields = PERSONALIZATION_FIELD_BLUEPRINT.map((field) => {
    const rawValue = sanitizeText(details[field.sourceKey]);
    return {
      id: field.id,
      label: resolveLabel(translations, field.labelKey, field.fallbackLabel),
      value: normalizeFallback(rawValue, resolvedFallback),
      isEmpty: rawValue.length === 0,
    };
  });

  const customSections = Array.isArray(details.customSections)
    ? details.customSections
        .map((section) => {
          const title = sanitizeText(section.title);
          const items = Array.isArray(section.items)
            ? section.items
                .map((item) => ({
                  id: item.id,
                  label: sanitizeText(item.label),
                  value: sanitizeText(item.value),
                }))
                .filter((item) => item.label || item.value)
            : [];

          if (!title && items.length === 0) {
            return null;
          }

          return {
            id: section.id,
            title: normalizeFallback(title, resolvedFallback),
            items,
          };
        })
        .filter(Boolean)
    : [];

  const summaryParts = [];
  const jobField = fields.find((field) => field.id === "job");
  if (jobField && !jobField.isEmpty) {
    summaryParts.push(jobField.value);
  }
  const goalField = fields.find((field) => field.id === "goal");
  if (goalField && !goalField.isEmpty) {
    summaryParts.push(goalField.value);
  }
  const abilityField = fields.find((field) => field.id === "currentAbility");
  if (abilityField && !abilityField.isEmpty) {
    summaryParts.push(abilityField.value);
  }

  const summary = summaryParts.join(" · ");

  const hasFieldDetails = fields.some((field) => !field.isEmpty);
  const hasCustomDetails = customSections.some((section) => section.items.length);

  return Object.freeze({
    fields,
    customSections,
    summary,
    hasDetails: hasFieldDetails || hasCustomDetails,
  });
}

export const PERSONALIZATION_INITIAL_STATE = Object.freeze({
  status: "idle",
  details: null,
  error: null,
});

export function personalizationReducer(state, action) {
  switch (action.type) {
    case "hydrate": {
      return {
        status: "ready",
        details: action.details ?? createEmptyProfileDetails(),
        error: null,
      };
    }
    case "loading": {
      return {
        status: "loading",
        details: state.details,
        error: null,
      };
    }
    case "success": {
      return {
        status: "ready",
        details: action.details ?? createEmptyProfileDetails(),
        error: null,
      };
    }
    case "failure": {
      return {
        status: "error",
        details: state.details ?? createEmptyProfileDetails(),
        error: action.error ?? new Error("personalization-load-failed"),
      };
    }
    case "reset": {
      return PERSONALIZATION_INITIAL_STATE;
    }
    default:
      return state;
  }
}

export function createPersonalizationInitialState() {
  return { ...PERSONALIZATION_INITIAL_STATE };
}

export function resolveSnapshotFromState(
  state,
  { translations, fallbackValue } = {},
) {
  const details = state?.details ?? createEmptyProfileDetails();
  return createPersonalizationSnapshot(details, { translations, fallbackValue });
}
