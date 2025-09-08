import Button from "@/components/ui/Button";
import ThemeIcon from "@/components/ui/Icon";
import { useOutsideToggle } from "@/hooks";
import { withStopPropagation } from "@/utils/stopPropagation.js";
import styles from "./ItemMenu.module.css";

function ItemMenu({ onFavorite, onDelete, favoriteLabel, deleteLabel }) {
  const { open, setOpen, ref } = useOutsideToggle(false);

  return (
    <div className={styles.wrapper} ref={ref}>
      <Button
        type="button"
        className={styles.action}
        onClick={withStopPropagation(() => {
          setOpen(!open);
        })}
        variant="ghost"
        shadow={false}
      >
        <ThemeIcon name="ellipsis-vertical" width={16} height={16} />
      </Button>
      {open && (
        <div className={styles.menu}>
          <Button
            type="button"
            onClick={withStopPropagation(() => {
              onFavorite();
              setOpen(false);
            })}
            variant="ghost"
            shadow={false}
          >
            <ThemeIcon
              name="star-solid"
              width={16}
              height={16}
              className={styles.icon}
            />{" "}
            {favoriteLabel}
          </Button>
          <Button
            type="button"
            className={styles["delete-btn"]}
            onClick={withStopPropagation(() => {
              onDelete();
              setOpen(false);
            })}
            variant="ghost"
            shadow={false}
          >
            <ThemeIcon
              name="trash"
              width={16}
              height={16}
              className={styles.icon}
            />{" "}
            {deleteLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ItemMenu;
