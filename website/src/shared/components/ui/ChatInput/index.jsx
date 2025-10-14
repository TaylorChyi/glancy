import PropTypes from "prop-types";

import ActionInput from "./ActionInput";
import styles from "./ChatInput.module.css";

const normalizeCssDimension = (value) => {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? `${value}px` : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
};

function ChatInput({ maxWidth, style: styleProp, ...actionInputProps }) {
  const normalizedMaxWidth = normalizeCssDimension(maxWidth);
  const hasCustomShellWidth =
    styleProp &&
    Object.prototype.hasOwnProperty.call(styleProp, "--chat-input-shell-width");

  // 通过自定义属性传递壳层宽度/最大宽度，交由布局层统一控制并保持 SearchBox 一致节奏。
  const cssVariables =
    normalizedMaxWidth === undefined
      ? undefined
      : {
          "--chat-input-shell-max": normalizedMaxWidth,
          ...(!hasCustomShellWidth && normalizedMaxWidth !== "auto"
            ? { "--chat-input-shell-width": `min(100%, ${normalizedMaxWidth})` }
            : {}),
        };

  const mergedStyle =
    cssVariables || styleProp
      ? { ...(cssVariables ?? {}), ...(styleProp ?? {}) }
      : undefined;

  return (
    <div className={styles.container} style={mergedStyle}>
      <ActionInput {...actionInputProps} />
    </div>
  );
}

ChatInput.propTypes = {
  maxWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  style: PropTypes.object,
};

ChatInput.defaultProps = {
  maxWidth: undefined,
  style: undefined,
};

export default ChatInput;
export { ActionInput };
export { ActionButton } from "./parts";
