import { useUser } from "@/context/UserContext.jsx";
import { useMemo } from "react";
import { cacheBust } from "@/utils";
import ThemeIcon from "@/components/ui/Icon";
import styles from "./Avatar.module.css";

// 基于当前主题切换默认头像
function Avatar({ src, alt = "User Avatar", ...props }) {
  const { user } = useUser();
  const finalSrc = src || user?.avatar;
  const displaySrc = useMemo(
    () => (finalSrc ? cacheBust(finalSrc) : null),
    [finalSrc],
  );
  if (finalSrc) {
    return (
      <img src={displaySrc} alt={alt} className={styles.avatar} {...props} />
    );
  }
  return (
    <ThemeIcon
      name="default-user-avatar"
      alt={alt}
      className={styles.avatar}
      {...props}
    />
  );
}

export default Avatar;
