/**
 * 背景：
 *  - 语音触发入口此前在组件内部重复实现遮罩解析与降级逻辑，导致与 SendIcon 存在分支差异，部分浏览器渲染出纯黑块。
 * 目的：
 *  - 借助 createMaskedIconRenderer 模板统一遮罩渲染流程，仅以策略函数定义语音资源的解析与样式构造，消除重复实现导致的偏差。
 * 关键决策与取舍：
 *  - 继续保留麦克风 SVG 作为 fallback，保证在遮罩不受支持时仍具备语义图形；策略函数仅依赖 single 资源，统一素材来源。
 * 影响范围：
 *  - ChatInput 语音按钮渲染行为与对应单元测试，修复部分浏览器下的黑块问题，并为未来语音动画扩展预留策略接口。
 * 演进与TODO：
 *  - 若需支持录音态的动态素材，可在 buildStyle 中注入额外属性或在 fallback 渲染动画节点。
 */
import PropTypes from "prop-types";

import createMaskedIconRenderer from "./createMaskedIconRenderer.jsx";

const VOICE_ICON_TOKEN = "voice-button";

const resolveVoiceIconResource = ({ registry }) => {
  const entry = registry?.[VOICE_ICON_TOKEN];
  return entry?.single ?? null;
};

const buildVoiceIconMaskStyle = ({ resource }) => {
  if (!resource) {
    return null;
  }

  const maskFragment = `url(${resource}) center / contain no-repeat`;
  return Object.freeze({
    mask: maskFragment,
    WebkitMask: maskFragment,
    backgroundColor: "currentColor",
  });
};

const defaultFallback = ({
  className,
  resource,
  iconName = VOICE_ICON_TOKEN,
}) => {
  if (resource) {
    return (
      <img
        aria-hidden="true"
        alt=""
        className={className}
        data-icon-name={iconName}
        draggable={false}
        src={resource}
      />
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 1024 1024"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      data-icon-name={iconName}
    >
      <path d="M512 128C417.707 128 341.333 204.373 341.333 298.667v256c0 94.293 76.373 170.667 170.667 170.667s170.667-76.373 170.667-170.667V298.667c0-94.293-76.373-170.667-170.667-170.667zm213.333 298.667v85.333c0 117.76-95.573 213.333-213.333 213.333s-213.333-95.573-213.333-213.333v-85.333H213.333v85.333c0 150.613 111.36 274.347 256 295.253V896h85.333v-88.747c144.64-20.907 256-144.64 256-295.253v-85.333h-85.333z" />
    </svg>
  );
};

const VoiceIcon = createMaskedIconRenderer({
  token: VOICE_ICON_TOKEN,
  resolveResource: resolveVoiceIconResource,
  buildStyle: buildVoiceIconMaskStyle,
  defaultFallback,
});

export default function VoiceIconWrapper({ className, fallback }) {
  return <VoiceIcon className={className} fallback={fallback} />;
}

VoiceIconWrapper.propTypes = {
  className: PropTypes.string.isRequired,
  fallback: PropTypes.func,
};

VoiceIconWrapper.defaultProps = {
  fallback: undefined,
};
