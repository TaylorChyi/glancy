import { useCallback } from "react";
import CollectionButton from "./CollectionButton.jsx";
import { useLanguage } from "@/context";
import styles from "./Sidebar.module.css";

const FALLBACK_FAVORITES_LABEL = "Favorites";

function Favorites({ onToggle }) {
  const { t } = useLanguage();

  const handleClick = useCallback(() => {
    if (typeof onToggle === "function") {
      onToggle((value) => !value);
    }
  }, [onToggle]);

  const favoritesSectionClassName = [
    styles["sidebar-section"],
    styles["favorites-list"],
    styles["sidebar-hoverable"],
  ].join(" ");

  const favoritesLabel = t.favorites || FALLBACK_FAVORITES_LABEL;
  const favoritesIconAlt = t.favoritesIconAlt || favoritesLabel;

  return (
    <div className={favoritesSectionClassName}>
      <CollectionButton
        icon="star-solid"
        label={favoritesLabel}
        iconAlt={favoritesIconAlt}
        onClick={handleClick}
      />
    </div>
  );
}

export default Favorites;
