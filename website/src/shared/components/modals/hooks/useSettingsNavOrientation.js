import { useMediaQuery } from "@shared/hooks";

const HORIZONTAL_NAV_BREAKPOINT = 768;
const HORIZONTAL_NAV_QUERY = `(max-width: ${HORIZONTAL_NAV_BREAKPOINT}px)`;

export const useSettingsNavOrientation = () => {
  const isHorizontalLayout = useMediaQuery(HORIZONTAL_NAV_QUERY);
  const orientation = isHorizontalLayout ? "horizontal" : "vertical";

  return {
    orientation,
    isHorizontalLayout,
  };
};
