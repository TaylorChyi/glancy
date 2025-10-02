/**
 * 背景：
 *  - 语音触发入口此前以纯色圆点占位，缺乏语义化表达且在无障碍设备上难以理解。
 * 目的：
 *  - 将麦克风图形封装为可复用的 UI 原子，统一资源解析、遮罩样式与降级策略。
 * 关键决策与取舍：
 *  - 延续 SendIcon 的资源解析与遮罩构造模板，复用既有策略以降低维护成本。
 *  - 放弃继续使用圆点样式，而以麦克风图形呈现，换取更强的语义与后续动画扩展空间。
 * 影响范围：
 *  - ChatInput 下所有语音相关按钮与未来潜在的语音入口组件。
 * 演进与TODO：
 *  - 若需针对录音态展示波形动画，可扩展 props 注入不同的遮罩资源或动画类名。
 */
import PropTypes from "prop-types";

import ICONS from "@/assets/icons.js";

const VOICE_ICON_TOKEN = "voice-button";

const resolveVoiceIconResource = (registry) => {
  const entry = registry?.[VOICE_ICON_TOKEN];
  if (!entry) {
    return null;
  }
  return entry.single ?? entry.light ?? entry.dark ?? null;
};

const buildVoiceIconMaskStyle = (resource) => {
  if (!resource) {
    return null;
  }
  const maskFragment = `url(${resource}) center / contain no-repeat`;
  return Object.freeze({
    mask: maskFragment,
    WebkitMask: maskFragment,
  });
};

const VOICE_ICON_MASK_STYLE = buildVoiceIconMaskStyle(
  resolveVoiceIconResource(ICONS),
);

const VOICE_ICON_INLINE_STYLE =
  VOICE_ICON_MASK_STYLE === null
    ? null
    : Object.freeze({
        ...VOICE_ICON_MASK_STYLE,
        backgroundColor: "currentColor",
      });

// 注：选用麦克风轮廓而非圆点，可直接传达语音含义并避免在暗色主题下失真。
const defaultFallback = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    viewBox="0 0 1024 1024"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    data-icon-name={VOICE_ICON_TOKEN}
  >
    <path d="M512 128C417.707 128 341.333 204.373 341.333 298.667v256c0 94.293 76.373 170.667 170.667 170.667s170.667-76.373 170.667-170.667V298.667c0-94.293-76.373-170.667-170.667-170.667zm213.333 298.667v85.333c0 117.76-95.573 213.333-213.333 213.333s-213.333-95.573-213.333-213.333v-85.333H213.333v85.333c0 150.613 111.36 274.347 256 295.253V896h85.333v-88.747c144.64-20.907 256-144.64 256-295.253v-85.333h-85.333z" />
  </svg>
);

function VoiceIcon({ className, fallback }) {
  if (!VOICE_ICON_INLINE_STYLE) {
    return fallback({ className, iconName: VOICE_ICON_TOKEN });
  }

  return (
    <span
      aria-hidden="true"
      className={className}
      data-icon-name={VOICE_ICON_TOKEN}
      style={VOICE_ICON_INLINE_STYLE}
    />
  );
}

VoiceIcon.propTypes = {
  className: PropTypes.string.isRequired,
  fallback: PropTypes.func,
};

VoiceIcon.defaultProps = {
  fallback: defaultFallback,
};

export default VoiceIcon;
