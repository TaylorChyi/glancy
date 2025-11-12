function composeVariantInput({
  key,
  label,
  value,
  options,
  onChange,
  normalizeValue,
  onOpen,
}) {
  return {
    key,
    label,
    value,
    options: options ?? [],
    onChange,
    normalizeValue,
    onOpen,
  };
}

function buildGroupLabel(sourceLabel, targetLabel) {
  const labelTokens = [sourceLabel, targetLabel].filter(Boolean);
  if (labelTokens.length === 0) {
    return "language selection";
  }
  return labelTokens.join(" → ");
}

function resolveSwapAction(onSwapLanguages, swapLabel) {
  if (typeof onSwapLanguages !== "function") {
    return null;
  }
  return {
    label: swapLabel || "Swap",
    onSwap: onSwapLanguages,
  };
}

export function createLauncherViewModel(props, openHandlers) {
  return {
    params: {
      source: composeVariantInput({
        key: "source",
        label: props.sourceLanguageLabel,
        value: props.sourceLanguage,
        options: props.sourceLanguageOptions,
        onChange: props.onSourceLanguageChange,
        normalizeValue: props.normalizeSourceLanguage,
        onOpen: openHandlers.source,
      }),
      target: composeVariantInput({
        key: "target",
        label: props.targetLanguageLabel,
        value: props.targetLanguage,
        options: props.targetLanguageOptions,
        onChange: props.onTargetLanguageChange,
        normalizeValue: props.normalizeTargetLanguage,
        onOpen: openHandlers.target,
      }),
    },
    groupLabel: buildGroupLabel(
      props.sourceLanguageLabel,
      props.targetLanguageLabel,
    ),
    swapAction: resolveSwapAction(props.onSwapLanguages, props.swapLabel),
  };
}
