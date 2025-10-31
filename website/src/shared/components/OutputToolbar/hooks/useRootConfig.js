/**
 * 背景：
 *  - OutputToolbar 需要统一的根节点样式与 aria 属性，重复计算会增加入口复杂度。
 * 目的：
 *  - 提供复用 Hook 生成根节点属性与按钮基础类名。
 * 关键决策与取舍：
 *  - 依赖 CSS Module 生成类名，保持现有视觉标记；
 *  - 使用 useMemo 缓存计算，避免每次渲染重复拼接字符串。
 * 影响范围：
 *  - OutputToolbar 入口与后续复用者。
 * 演进与TODO：
 *  - 若未来引入多主题样式，可在此扩展策略。
 */
import { useMemo } from "react";
import styles from "../styles/index.js";

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
