import { useMediaQuery } from "@shared/hooks";

export function getModifierKey() {
  const platform =
    navigator.userAgentData?.platform || navigator.platform || "";
  return /Mac|iPhone|iPod|iPad/i.test(platform)
    ? "Command \u2318"
    : "Ctrl \u2303";
}

export function useIsMobile(maxWidth = 600) {
  return useMediaQuery(`(max-width: ${maxWidth}px)`);
}
