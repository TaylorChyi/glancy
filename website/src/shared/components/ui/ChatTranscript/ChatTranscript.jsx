/**
 * 背景：
 *  - ChatView 直接承担消息渲染与样式拼装，导致页面职责膨胀且难以在其他上下文复用。
 * 目的：
 *  - 抽象出可复用的聊天记录组件，仅暴露样式容器与渲染钩子，隔离 Markdown 解析等实现细节。
 * 关键决策与取舍：
 *  - 采用模板方法（renderMessage 回调）允许调用方覆写单条消息的渲染，同时默认复用 MarkdownRenderer；
 *  - 保持样式封装在组件内部，调用方仅需关心行为组合，避免再度泄漏结构细节。
 * 影响范围：
 *  - ChatView 及未来需要展示对话历史的页面；
 *  - MarkdownRenderer 仍作为默认解析器对外暴露，兼容既有功能。
 * 演进与TODO：
 *  - 后续若引入系统/工具消息，可在 resolveRoleClassName 中扩展角色映射；
 *  - 如需虚拟滚动，可在保持接口不变的前提下替换内部容器实现。
 */
import PropTypes from "prop-types";

import MarkdownRenderer from "../MarkdownRenderer";
import styles from "./ChatTranscript.module.css";

function composeClassName(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

const ROLE_CLASS_MAP = Object.freeze({
  user: styles.user,
  assistant: styles.assistant,
});

function resolveRoleClassName(role) {
  return ROLE_CLASS_MAP[role] ?? styles.assistant;
}

function defaultRenderMessage(message, context) {
  const RendererComponent = context.Renderer;
  return <RendererComponent>{message.content}</RendererComponent>;
}

function ChatTranscript({
  messages,
  className,
  renderer: Renderer,
  renderMessage,
}) {
  const EffectiveRenderer = Renderer ?? MarkdownRenderer;
  const render = renderMessage ?? defaultRenderMessage;

  return (
    <div className={composeClassName(styles.transcript, className)}>
      {messages.map((message, index) => {
        const key = message.id ?? message.key ?? index;
        const roleClass = resolveRoleClassName(message.role);
        return (
          <article
            key={key}
            className={composeClassName(styles.message, roleClass)}
            data-role={message.role}
          >
            {render(message, { Renderer: EffectiveRenderer, index })}
          </article>
        );
      })}
    </div>
  );
}

ChatTranscript.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      role: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired,
    }),
  ),
  className: PropTypes.string,
  renderer: PropTypes.elementType,
  renderMessage: PropTypes.func,
};

ChatTranscript.defaultProps = {
  messages: [],
  className: undefined,
  renderer: undefined,
  renderMessage: undefined,
};

export default ChatTranscript;
