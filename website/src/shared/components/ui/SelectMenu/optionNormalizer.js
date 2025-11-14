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

const getActivePresentation = (activeOption) => {
  if (!activeOption) {
    return null;
  }

  return {
    displayOption: activeOption,
    triggerLabel: activeOption.label,
    isShowingPlaceholder: false,
  };
};

const getPlaceholderPresentation = (placeholderLabel, fallbackOption) => {
  if (!placeholderLabel) {
    return null;
  }

  return {
    displayOption: fallbackOption ?? null,
    triggerLabel: placeholderLabel,
    isShowingPlaceholder: true,
  };
};

const getFallbackPresentation = (fallbackOption) => {
  if (!fallbackOption) {
    return null;
  }

  return {
    displayOption: fallbackOption,
    triggerLabel: fallbackOption.label,
    isShowingPlaceholder: false,
  };
};

const deriveTriggerPresentation = ({
  activeOption,
  fallbackOption,
  placeholderLabel,
}) => {
  return (
    getActivePresentation(activeOption) ??
    getPlaceholderPresentation(placeholderLabel, fallbackOption) ??
    getFallbackPresentation(fallbackOption) ?? {
      displayOption: null,
      triggerLabel: "",
      isShowingPlaceholder: false,
    }
  );
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
