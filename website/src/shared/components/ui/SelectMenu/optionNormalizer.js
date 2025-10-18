/**
 * 背景：
 *  - SelectMenu 组件最初直接在主文件中处理选项清洗与展示状态推导，导致文件超限且难以复用。
 * 目的：
 *  - 下沉与选项相关的纯函数与 PropTypes 定义，保持组件文件聚焦交互组合。
 * 关键决策与取舍：
 *  - 采用“数据标准化 + 视图派生”双函数，支持后续自定义分组或分页策略；
 *  - 保留字符串裁剪逻辑，拒绝在渲染层补救脏数据，保障一致性。
 * 影响范围：
 *  - SelectMenu 组件的选项渲染、键盘导航和可访问性标签。
 * 演进与TODO：
 *  - TODO: 如需扩展选项图标/禁用态，可在 normalizeOptions 中补充字段并在 resolveDisplayState 中维护推导规则。
 */
import PropTypes from "prop-types";

export const OptionShape = PropTypes.shape({
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
});

export const isMeaningfulValue = (value) =>
  typeof value === "string" && value.trim().length > 0;

export function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .map((option) => {
      if (!option || !isMeaningfulValue(option.label)) {
        return null;
      }

      const rawValue = option.value;
      const normalizedValue =
        rawValue != null && rawValue !== ""
          ? String(rawValue)
          : String(option.label.trim());

      if (!normalizedValue) {
        return null;
      }

      return {
        rawValue,
        normalizedValue,
        label: option.label.trim(),
        description: isMeaningfulValue(option.description)
          ? option.description.trim()
          : undefined,
      };
    })
    .filter(Boolean);
}

const toPlaceholderLabel = (placeholder) =>
  isMeaningfulValue(placeholder) ? placeholder.trim() : undefined;

const deriveTriggerPresentation = ({
  activeOption,
  fallbackOption,
  placeholderLabel,
}) => {
  if (activeOption) {
    return {
      displayOption: activeOption,
      triggerLabel: activeOption.label,
      isShowingPlaceholder: false,
    };
  }

  if (placeholderLabel) {
    return {
      displayOption: fallbackOption ?? null,
      triggerLabel: placeholderLabel,
      isShowingPlaceholder: true,
    };
  }

  if (fallbackOption) {
    return {
      displayOption: fallbackOption,
      triggerLabel: fallbackOption.label,
      isShowingPlaceholder: false,
    };
  }

  return {
    displayOption: null,
    triggerLabel: "",
    isShowingPlaceholder: false,
  };
};

export function resolveDisplayState({ options, normalizedValue, placeholder }) {
  const activeOption = options.find(
    (option) => option.normalizedValue === normalizedValue,
  );
  const fallbackOption = options[0] ?? null;
  const placeholderLabel = toPlaceholderLabel(placeholder);

  const { displayOption, triggerLabel, isShowingPlaceholder } =
    deriveTriggerPresentation({
      activeOption,
      fallbackOption,
      placeholderLabel,
    });

  return {
    activeOption,
    placeholderLabel,
    displayOption,
    triggerLabel,
    isShowingPlaceholder,
  };
}
