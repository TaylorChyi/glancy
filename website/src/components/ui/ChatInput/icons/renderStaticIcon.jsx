/**
 * 背景：
 *  - ChatInput 的发送与语音按钮共享相同的静态渲染模式，若直接复制实现会造成重复。
 * 目的：
 *  - 提供纯函数帮助，以组合方式复用 img 渲染逻辑，同时保持与旧遮罩方案完全解耦。
 * 关键决策与取舍：
 *  - 使用最小化的模板函数而非组件包装，避免在调试时引入额外节点层级。
 *  - 优先渲染 inline SVG，以便继承 currentColor，从而契合浅色主题的反相需求；
 *    若缺失 inline 资源则回退到静态图片，保持对历史资产的兼容。
 * 影响范围：
 *  - 当前仅服务 SendIcon 与 VoiceIcon，未来扩展静态图标时可继续复用。
 * 演进与TODO：
 *  - 若需要根据主题切换资源，可在调用侧扩展 src 选择逻辑后传入此函数。
 */
const hasInlinePayload = (payload) =>
  typeof payload === "string" && Boolean(payload.trim());

const renderInlineVariant = ({ className, iconName, inline }) => (
  <span
    aria-hidden="true"
    className={className}
    data-icon-name={iconName}
    data-render-mode="inline"
    dangerouslySetInnerHTML={{ __html: inline }}
    draggable={false}
  />
);

const renderImageVariant = ({ className, iconName, src }) => (
  <img
    alt=""
    aria-hidden="true"
    className={className}
    data-icon-name={iconName}
    data-render-mode="image"
    draggable={false}
    src={src}
  />
);

export default function renderStaticIcon({ className, iconName, src, inline }) {
  if (hasInlinePayload(inline)) {
    return renderInlineVariant({ className, iconName, inline });
  }
  if (src) {
    return renderImageVariant({ className, iconName, src });
  }
  return null;
}
