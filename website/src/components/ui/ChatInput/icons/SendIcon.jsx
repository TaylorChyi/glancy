/**
 * 背景：
 *  - ChatInput 的发送动作依赖纸飞机符号，但历史实现内联于 ActionInput 难以复用。
 * 目的：
 *  - 将纸飞机资源解析与遮罩样式封装为独立组件，支撑后续多入口重用。
 * 关键决策与取舍：
 *  - 采用配置清单驱动的资源解析策略，避免硬编码 URL；如清单缺失则降级到内联 SVG。
 *  - 放弃在此处引入 IconContext，保持组件纯净，交由上层控制配色与尺寸。
 * 影响范围：
 *  - ActionButton 与后续可能引用发送图标的组件。
 * 演进与TODO：
 *  - 如需支持主题化或动画，可在保持纯函数接口的前提下扩展 props。
 */
import PropTypes from "prop-types";
import ICONS from "@/assets/icons.js";

const SEND_ICON_TOKEN = "paper-airplane";
/**
 * 说明：
 *  - send-button 资产虽已切换为相同纸飞机几何，但其 light/dark 变体仍服务于按钮蒙版，
 *    若直接引用会让通用图标组件与按钮实现产生耦合；因此继续解析通用的 paper-airplane 令牌。
 *  - 一旦 icon manifest 支持别名或统一引用，可在保持向后兼容的前提下退化至 send-button 令牌以减少资源冗余。
 */

const resolveSendIconResource = (registry) => {
  const entry = registry?.[SEND_ICON_TOKEN];
  if (!entry) {
    return null;
  }
  return entry.single ?? entry.light ?? entry.dark ?? null;
};

const buildSendIconMaskStyle = (resource) => {
  if (!resource) {
    return null;
  }
  const maskFragment = `url(${resource}) center / contain no-repeat`;
  return Object.freeze({
    mask: maskFragment,
    WebkitMask: maskFragment,
  });
};

const SEND_ICON_MASK_STYLE = buildSendIconMaskStyle(
  resolveSendIconResource(ICONS),
);

const SEND_ICON_INLINE_STYLE =
  SEND_ICON_MASK_STYLE === null
    ? null
    : Object.freeze({
        ...SEND_ICON_MASK_STYLE,
        backgroundColor: "currentColor",
      });

const defaultFallback = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 18 18"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2.25 15.75 16.5 9 2.25 2.25l4.5 6-4.5 7.5Z" />
  </svg>
);

function SendIcon({ className, fallback }) {
  if (!SEND_ICON_INLINE_STYLE) {
    return fallback({ className, iconName: SEND_ICON_TOKEN });
  }

  return (
    <span
      aria-hidden="true"
      className={className}
      data-icon-name={SEND_ICON_TOKEN}
      style={SEND_ICON_INLINE_STYLE}
    />
  );
}

SendIcon.propTypes = {
  className: PropTypes.string.isRequired,
  fallback: PropTypes.func,
};

SendIcon.defaultProps = {
  fallback: defaultFallback,
};

export default SendIcon;
