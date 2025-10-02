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
import { useMemo } from "react";
import PropTypes from "prop-types";

import { useTheme } from "@/context";
import ICONS from "@/assets/icons.js";
import useMaskSupport from "./useMaskSupport.js";

const SEND_ICON_TOKEN = "send-button";
/**
 * 说明：
 *  - 发送按钮图标切换为 send-button 令牌，以便显式承载按钮专用的 light/dark 变体。
 *  - 通过主题上下文选择对应资源，保留 single 作为降级路径，避免 dark/light 缺失时闪烁。
 */

// 说明：遮罩策略需兼容生成脚本返回的对象以及测试桩传入的字符串，两者统一在此适配。
const normaliseIconAsset = (candidate) => {
  if (!candidate) {
    return null;
  }

  if (typeof candidate === "string") {
    return { src: candidate };
  }

  return candidate;
};

const resolveSendIconResource = (registry, resolvedTheme) => {
  const entry = registry?.[SEND_ICON_TOKEN];
  if (!entry) {
    return null;
  }

  const themeKey = resolvedTheme === "dark" ? "dark" : "light";
  const themedResource = normaliseIconAsset(entry[themeKey]);

  if (themedResource?.src) {
    return themedResource;
  }

  const singleVariant = normaliseIconAsset(entry.single);

  if (singleVariant?.src) {
    return singleVariant;
  }

  const alternativeKey = themeKey === "dark" ? "light" : "dark";
  const alternativeResource = normaliseIconAsset(entry[alternativeKey]);
  return alternativeResource?.src ? alternativeResource : null;
};

const buildSendIconInlineStyle = (resource) => {
  const payload = normaliseIconAsset(resource);

  if (!payload?.src) {
    return null;
  }

  const maskFragment = `url(${payload.src}) center / contain no-repeat`;
  return {
    mask: maskFragment,
    WebkitMask: maskFragment,
    backgroundColor: "currentColor",
  };
};

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
  const { resolvedTheme = "light" } = useTheme() ?? {};
  const isMaskSupported = useMaskSupport();
  const effectiveFallback = fallback ?? defaultFallback;

  const inlineStyle = useMemo(() => {
    if (!isMaskSupported) {
      return null;
    }

    const resource = resolveSendIconResource(ICONS, resolvedTheme);
    return buildSendIconInlineStyle(resource);
  }, [isMaskSupported, resolvedTheme]);

  if (!inlineStyle) {
    return effectiveFallback({ className, iconName: SEND_ICON_TOKEN });
  }

  return (
    <span
      aria-hidden="true"
      className={className}
      data-icon-name={SEND_ICON_TOKEN}
      style={inlineStyle}
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
