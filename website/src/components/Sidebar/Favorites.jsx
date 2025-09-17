import ThemeIcon from "@/components/ui/Icon";
import { useLanguage } from "@/context";
import styles from "./Sidebar.module.css";

const FALLBACK_FAVORITES_LABEL = "Favorites";

const getFavoritesIconAlt = (label, altFromLocale) => altFromLocale || label;

function Favorites({ onToggle }) {
  const { t } = useLanguage();

  const handleClick = () => {
    if (onToggle) onToggle((v) => !v);
  };

  const favoritesSectionClassName = [
    styles["sidebar-section"],
    styles["favorites-list"],
    styles["sidebar-hoverable"],
  ].join(" ");

  const favoritesLabel = t.favorites || FALLBACK_FAVORITES_LABEL;
  const favoritesIconAlt = getFavoritesIconAlt(
    favoritesLabel,
    t.favoritesIconAlt,
  );

  return (
    <div className={favoritesSectionClassName}>
      <h3 className={styles["collection-button"]} onClick={handleClick}>
        <ThemeIcon
          name="star-solid"
          alt={favoritesIconAlt}
          width={16}
          height={16}
        />
        {favoritesLabel}
      </h3>
    </div>
  );
}

export default Favorites;
