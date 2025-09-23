import Avatar from "@/components/ui/Avatar";
import styles from "./Header.module.css";
import ThemeIcon from "@/components/ui/Icon";

function UserMenuDropdown({
  open,
  setOpen,
  t,
  username,
  isPro,
  openProfile,
  openSettings,
  openShortcuts,
  openUpgrade,
  openLogout,
}) {
  if (!open) return null;
  return (
    <div className={styles.menu}>
      <div className={styles["menu-header"]}>
        <div className={styles.avatar}>
          <Avatar width={32} height={32} />
        </div>
        {username ? <div className={styles.identity}>{username}</div> : null}
      </div>
      <ul>
        {!isPro && (
          <li onClick={() => openUpgrade()}>
            <ThemeIcon
              name="shield-check"
              className={styles.icon}
              width={20}
              height={20}
            />
            {t.upgrade}
          </li>
        )}
        <li onClick={openProfile}>
          <ThemeIcon
            name="adjustments-horizontal"
            className={styles.icon}
            width={20}
            height={20}
          />
          {t.profile}
        </li>
        <li onClick={openSettings}>
          <ThemeIcon
            name="cog-6-tooth"
            className={styles.icon}
            width={20}
            height={20}
          />
          {t.settings}
        </li>
        <li onClick={openShortcuts}>
          <ThemeIcon
            name="command-line"
            className={styles.icon}
            width={20}
            height={20}
          />
          {t.shortcuts}
        </li>
      </ul>
      <ul>
        <li>
          <ThemeIcon
            name="arrow-right-on-rectangle"
            className={styles.icon}
            width={20}
            height={20}
          />
          <button
            type="button"
            onClick={() => {
              openLogout();
              setOpen(false);
            }}
            className={styles["menu-btn"]}
          >
            {t.logout}
          </button>
        </li>
      </ul>
    </div>
  );
}

export default UserMenuDropdown;
