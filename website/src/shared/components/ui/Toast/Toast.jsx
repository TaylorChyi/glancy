import { useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import styles from "./Toast.module.css";

/**
 * 背景：
 *  - 旧版 Toast 仅支持底部轻量提示，缺乏可配置性，难以在兑换等流程中复用。
 * 目的：
 *  - 提供可设定主题色、停留时长与关闭交互的提示条，统一在页面顶部展示执行结果。
 * 关键决策与取舍：
 *  - 通过 CSS 变量暴露颜色，既允许调用方定制，也确保符合主题令牌体系；拒绝在组件内硬编码样式常量。
 * 影响范围：
 *  - 所有引用 Toast 的入口（如 TTS、历史记录、偏好设置）都会获得新的样式与交互能力。
 * 演进与TODO：
 *  - TODO: 后续可扩展图标/队列能力，或引入无障碍朗读策略配置。
 */
const DEFAULT_DURATION = 3000;
const DEFAULT_CLOSE_LABEL = "Dismiss notification";

function Toast({
  open,
  message,
  duration = DEFAULT_DURATION,
  onClose,
  backgroundColor,
  textColor,
  closeLabel = DEFAULT_CLOSE_LABEL,
}) {
  const handleClose = useCallback(() => {
    if (typeof onClose === "function") {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    if (typeof duration !== "number" || duration <= 0) {
      return undefined;
    }
    if (!Number.isFinite(duration)) {
      return undefined;
    }
    if (typeof onClose !== "function") {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, duration, onClose]);

  const inlineStyle = useMemo(() => {
    const style = {};
    if (backgroundColor) {
      style["--toast-bg"] = backgroundColor;
    }
    if (textColor) {
      style["--toast-color"] = textColor;
    }
    return style;
  }, [backgroundColor, textColor]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={styles.toast}
      role="status"
      aria-live="polite"
      style={inlineStyle}
    >
      <button
        type="button"
        className={styles["dismiss-button"]}
        aria-label={closeLabel}
        onClick={handleClose}
      >
        <span aria-hidden="true">×</span>
      </button>
      <p className={styles.message}>{message}</p>
    </div>
  );
}

Toast.propTypes = {
  open: PropTypes.bool,
  message: PropTypes.string,
  duration: PropTypes.number,
  onClose: PropTypes.func,
  backgroundColor: PropTypes.string,
  textColor: PropTypes.string,
  closeLabel: PropTypes.string,
};

Toast.defaultProps = {
  open: false,
  message: "",
  duration: DEFAULT_DURATION,
  onClose: undefined,
  backgroundColor: undefined,
  textColor: undefined,
  closeLabel: DEFAULT_CLOSE_LABEL,
};

export default Toast;
