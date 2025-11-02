/**
 * 背景：
 *  - ChatInput 从多态动作切回纯发送模式，需要在视觉与行为上重新定义按钮职责。
 * 目的：
 *  - 提供单一发送按钮，统一处理禁用与聚焦恢复逻辑，避免残留语音路径。
 * 关键决策与取舍：
 *  - 使用布尔开关表达“可发送”状态，将语义类固定在发送态以保持主题一致；
 *  - 依旧复用 restoreFocus 以保障键盘流畅性，未在组件内直接操作输入值。
 * 影响范围：
 *  - ChatInput 动作区的可交互元素与依赖其语义类的样式映射。
 * 演进与TODO：
 *  - 后续如需重新引入多动作策略，可在 Hook 层扩展配置并回收策略接口。
 */
import { useCallback } from "react";
import PropTypes from "prop-types";

import styles from "../ChatInput.module.css";
import { SendIcon } from "../icons";

function ActionButton({ canSubmit, onSubmit, sendLabel, restoreFocus }) {
  const actionClassName = [
    styles["action-button"],
    styles["action-button-send"],
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = useCallback(
    (event) => {
      event.preventDefault();
      if (!canSubmit) {
        return;
      }
      onSubmit?.();
      restoreFocus?.();
    },
    [canSubmit, onSubmit, restoreFocus],
  );

  return (
    <button
      type="button"
      className={actionClassName}
      onClick={handleClick}
      aria-label={sendLabel}
      disabled={!canSubmit}
    >
      <SendIcon className={styles["action-button-icon"]} />
    </button>
  );
}

ActionButton.propTypes = {
  canSubmit: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func,
  sendLabel: PropTypes.string.isRequired,
  restoreFocus: PropTypes.func,
};

ActionButton.defaultProps = {
  onSubmit: undefined,
  restoreFocus: undefined,
};

export default ActionButton;
