import { useCallback } from "react";
import { useLanguage } from "@/context";
import SidebarActionItem from "./SidebarActionItem.jsx";
import { SIDEBAR_ACTION_VARIANTS } from "./sidebarActionVariants.js";

const FALLBACK_FAVORITES_LABEL = "Favorites";

function Favorites({ onToggle }) {
  const { t } = useLanguage();

  const handleClick = useCallback(() => {
    if (typeof onToggle === "function") {
      onToggle((value) => !value);
    }
  }, [onToggle]);

  const favoritesLabel = t.favorites || FALLBACK_FAVORITES_LABEL;
  const favoritesIconAlt = t.favoritesIconAlt || favoritesLabel;

  return (
    <SidebarActionItem
      icon="star-solid"
      label={favoritesLabel}
      iconAlt={favoritesIconAlt}
      onClick={handleClick}
      variant={SIDEBAR_ACTION_VARIANTS.prominent}
    />
  );
}

export default Favorites;
