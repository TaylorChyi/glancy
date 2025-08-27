import ModelSelector from "@/components/Toolbar";
import { useLanguage } from "@/context";
import { useUser } from "@/context/UserContext.jsx";
import { useOutsideToggle } from "@/hooks";
import common from "./TopBarCommon.module.css";
import ThemeIcon from "@/components/ui/Icon";

function TopBarActions({
  favorited = false,
  onToggleFavorite,
  canFavorite = false,
}) {
  const { open, setOpen, ref: menuRef } = useOutsideToggle(false);
  const { t } = useLanguage();
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className={common["topbar-right"]}>
      {canFavorite && (
        <button
          type="button"
          className={common["favorite-toggle"]}
          onClick={onToggleFavorite}
        >
          {favorited ? (
            <ThemeIcon name="star-solid" width={24} height={24} />
          ) : (
            <ThemeIcon name="star-outline" width={24} height={24} />
          )}
        </button>
      )}
      <ModelSelector />
      <div className={common["more-menu"]} ref={menuRef}>
        <button
          type="button"
          className={common["more-btn"]}
          onClick={() => setOpen(!open)}
        >
          <ThemeIcon name="ellipsis-vertical" width={20} height={20} />
        </button>
        {open && (
          <div className={common.menu}>
            <button type="button">
              <ThemeIcon
                name="link"
                className={common.icon}
                width={16}
                height={16}
              />
              {t.share}
            </button>
            <button type="button">
              <ThemeIcon
                name="flag"
                className={common.icon}
                width={16}
                height={16}
              />
              {t.report}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopBarActions;
