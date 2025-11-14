import { useUser } from "@core/context";
import { useMemo, useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { cacheBust } from "@shared/utils";
import ThemeIcon from "@shared/components/ui/Icon";
import styles from "./Avatar.module.css";

const ELEVATIONS = Object.freeze({
  soft: "soft",
  none: "none",
});

const VISUAL_SLOT = "avatar-visual";

function useAvatarDisplay({ src, className, onError }) {
  const { user } = useUser();
  const finalSrc = src || user?.avatar;
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [finalSrc]);

  const mergedClassName = useMemo(
    () => [styles.avatar, className].filter(Boolean).join(" "),
    [className],
  );

  const displaySrc = useMemo(() => {
    if (!finalSrc || hasError) {
      return null;
    }
    return cacheBust(finalSrc);
  }, [finalSrc, hasError]);

  const handleImageError = useCallback(
    (event) => {
      setHasError(true);
      if (typeof onError === "function") {
        onError(event);
      }
    },
    [onError],
  );

  return { displaySrc, mergedClassName, handleImageError };
}

// 基于当前主题切换默认头像
function Avatar({
  src,
  alt = "User Avatar",
  className,
  onError,
  elevation = ELEVATIONS.soft,
  ...props
}) {
  const { displaySrc, mergedClassName, handleImageError } = useAvatarDisplay({
    src,
    className,
    onError,
  });

  if (displaySrc) {
    return (
      <img
        src={displaySrc}
        alt={alt}
        className={mergedClassName}
        onError={handleImageError}
        data-elevation={elevation}
        data-slot={VISUAL_SLOT}
        {...props}
      />
    );
  }
  return (
    <ThemeIcon
      name="default-user-avatar"
      alt={alt}
      className={mergedClassName}
      data-elevation={elevation}
      data-slot={VISUAL_SLOT}
      {...props}
    />
  );
}

export default Avatar;

Avatar.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  onError: PropTypes.func,
  elevation: PropTypes.oneOf(Object.values(ELEVATIONS)),
};
