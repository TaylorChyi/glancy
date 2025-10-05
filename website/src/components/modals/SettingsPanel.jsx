/**
 * 背景：
 *  - 偏好设置内容区在模态与页面中重复声明 aria/role 属性，增加维护成本。
 * 目的：
 *  - 封装语义化的 tabpanel 容器，保持结构一致并降低可访问性错误风险。
 * 关键决策与取舍：
 *  - 组件负责语义包装并通过回调同步标题元素，以便外部 hook 统一处理焦点；仍避免干预实际内容渲染。
 * 影响范围：
 *  - SettingsModal 与 Preferences 页面内容区域。
 * 演进与TODO：
 *  - TODO: 若未来需要延迟加载，可在此扩展 loading/empty 状态插槽。
 */
import { useLayoutEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import useStableHeight from "@/hooks/useStableHeight.js";

function SettingsPanel({
  panelId,
  tabId,
  headingId,
  className,
  children,
  onHeadingElementChange,
}) {
  const headingElementRef = useRef(null);
  const heightDependencies = useMemo(() => [panelId], [panelId]);
  const { containerRef, style: stableHeightStyle } = useStableHeight({
    //
    // 采用 retain-max 策略在切换分区时锁定历史最大高度，确保面板不随内容收缩。
    dependencies: heightDependencies,
  });

  useLayoutEffect(() => {
    if (typeof document === "undefined") {
      headingElementRef.current = null;
      if (typeof onHeadingElementChange === "function") {
        onHeadingElementChange(null);
      }
      return undefined;
    }

    if (!headingId) {
      headingElementRef.current = null;
      if (typeof onHeadingElementChange === "function") {
        onHeadingElementChange(null);
      }
      return undefined;
    }

    const nextHeading = document.getElementById(headingId);
    headingElementRef.current = nextHeading ?? null;
    if (typeof onHeadingElementChange === "function") {
      onHeadingElementChange(headingElementRef.current);
    }

    return () => {
      headingElementRef.current = null;
      if (typeof onHeadingElementChange === "function") {
        onHeadingElementChange(null);
      }
    };
  }, [headingId, onHeadingElementChange]);

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      className={className}
      ref={containerRef}
      style={stableHeightStyle}
    >
      {children}
    </div>
  );
}

SettingsPanel.propTypes = {
  panelId: PropTypes.string.isRequired,
  tabId: PropTypes.string.isRequired,
  headingId: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
  onHeadingElementChange: PropTypes.func,
};

SettingsPanel.defaultProps = {
  headingId: undefined,
  className: "",
  children: null,
  onHeadingElementChange: undefined,
};

export default SettingsPanel;

