import { useMemo } from "react";

import { useTheme } from "@core/context";

const ICON_TONE_VARIANTS = Object.freeze({
  default: Object.freeze({
    tone: "default",
    colorToken: "var(--color-text)",
    isInverse: false,
  }),
  inverse: Object.freeze({
    tone: "inverse",
    colorToken: "var(--color-text-inverse, var(--neutral-0))",
    isInverse: true,
  }),
});

const STRATEGY_TABLE = Object.freeze({
  default: () => ICON_TONE_VARIANTS.default,
  inverse: () => ICON_TONE_VARIANTS.inverse,
  auto: (resolvedTheme) =>
    resolvedTheme === "light"
      ? ICON_TONE_VARIANTS.inverse
      : ICON_TONE_VARIANTS.default,
});

const FALLBACK_STRATEGY = STRATEGY_TABLE.default;

export const resolveIconTone = ({ requestedTone, resolvedTheme }) => {
  const strategy = STRATEGY_TABLE[requestedTone] ?? FALLBACK_STRATEGY;
  const variant = strategy(resolvedTheme);

  return {
    tone: variant.tone,
    isInverse: variant.isInverse,
    colorToken: variant.colorToken,
  };
};

export default function useIconToneController({ tone = "auto" } = {}) {
  const { resolvedTheme } = useTheme();

  return useMemo(
    () => resolveIconTone({ requestedTone: tone, resolvedTheme }),
    [tone, resolvedTheme],
  );
}
