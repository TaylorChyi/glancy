/**
 * 背景：
 *  - ChatInput 的发送动作依赖纸飞机符号，但历史实现将遮罩解析与组件逻辑耦合，导致与 VoiceIcon 等同类组件存在重复代码，维护困难。
 * 目的：
 *  - 基于统一的 createMaskedIconRenderer 模板方法，将资源解析与遮罩样式构建作为策略注入，确保发送图标与语音图标共享一致骨架。
 * 关键决策与取舍：
 *  - 采用策略函数描述资源选择与样式生成，保留模板对降级逻辑的控制，避免自定义实现偏离探测流程。
 *  - 在主题退化逻辑下仅消费单一矢量资源（single），统一样式来源，减少多态素材的维护成本。
 *  - 保留 SVG fallback 以应对遮罩不可用场景，并在注释中保留扩展点说明，确保未来动画或主题扩展有容纳空间。
 * 影响范围：
 *  - ChatInput 的发送按钮图标渲染逻辑及其单测；其他依赖 send-button 令牌的入口也将受益于统一策略。
 * 演进与TODO：
 *  - 若后续需要为发送图标增加动态效果，可通过扩展 buildStyle 或 fallback 注入额外类名与属性。
 */
import PropTypes from "prop-types";

import createMaskedIconRenderer from "./createMaskedIconRenderer.jsx";

const SEND_ICON_TOKEN = "send-button";

const resolveSendIconResource = ({ registry }) => {
  const entry = registry?.[SEND_ICON_TOKEN];
  return entry?.single ?? null;
};

const buildSendIconInlineStyle = ({ resource }) => {
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

const SendIcon = createMaskedIconRenderer({
  token: SEND_ICON_TOKEN,
  resolveResource: resolveSendIconResource,
  buildStyle: buildSendIconInlineStyle,
  defaultFallback,
});

// 说明：导出具名组件以补充 PropTypes，保持接口语义清晰，可在无需主题的环境中强制传入 className。
export default function SendIconWrapper({ className, fallback }) {
  return <SendIcon className={className} fallback={fallback} />;
}

SendIconWrapper.propTypes = {
  className: PropTypes.string.isRequired,
  fallback: PropTypes.func,
};

SendIconWrapper.defaultProps = {
  fallback: undefined,
};
