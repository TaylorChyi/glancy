import { useMemo } from "react";
import styles from "../OutputToolbar.module.css";

export const useRootConfig = ({ className, toolbarRole, ariaLabel }) => {
  const rootClassName = useMemo(
    () =>
      Array.from(
        new Set([styles.toolbar, "entry__toolbar", className].filter(Boolean)),
      ).join(" "),
    [className],
  );
  const baseToolButtonClass = useMemo(
    () => [styles["tool-button"], "entry__tool-btn"].filter(Boolean).join(" "),
    [],
  );
  const rootProps = useMemo(
    () => ({
      className: rootClassName,
      role: toolbarRole,
      ariaLabel,
      dataTestId: "output-toolbar",
    }),
    [ariaLabel, rootClassName, toolbarRole],
  );
  return { rootProps, baseToolButtonClass };
};
