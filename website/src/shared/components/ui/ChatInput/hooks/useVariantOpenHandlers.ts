import { useMemo } from "react";

export type VariantKey = "source" | "target";

export interface VariantOpenHandlers {
  source?: () => void;
  target?: () => void;
}

export default function useVariantOpenHandlers(
  onMenuOpen?: (variant: VariantKey) => void,
): VariantOpenHandlers {
  return useMemo(() => {
    if (typeof onMenuOpen !== "function") {
      return { source: undefined, target: undefined };
    }
    const mountHandler = (variant: VariantKey) => () => onMenuOpen(variant);
    return {
      source: mountHandler("source"),
      target: mountHandler("target"),
    };
  }, [onMenuOpen]);
}
