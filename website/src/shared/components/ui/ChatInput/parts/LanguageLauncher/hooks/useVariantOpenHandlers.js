import { useMemo } from "react";

export function useVariantOpenHandlers(onMenuOpen) {
  return useMemo(() => {
    if (typeof onMenuOpen !== "function") {
      return { source: undefined, target: undefined };
    }
    return {
      source: () => onMenuOpen("source"),
      target: () => onMenuOpen("target"),
    };
  }, [onMenuOpen]);
}
