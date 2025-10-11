/**
 * 背景：
 *  - Doubao 等模型在流式输出时会将文本拆分为 message/content/segment 等嵌套结构，
 *    前端若直接透传将导致渲染层缺少必要的顺序与空格信息。
 * 目的：
 *  - 提供统一的流式内容展开工具，抽象出层级遍历逻辑，供聊天与词典等场景复用，
 *    保证 Markdown/纯文本在进入展示层前已经被拼接成可读字符串。
 * 关键决策与取舍：
 *  - 通过递归收集策略覆盖 text/content/segments/messages 多种字段，而非在各调用方硬编码，
 *    以策略化的函数组合方式支撑后续模型协议演进。
 * 影响范围：
 *  - 所有依赖流式接口的 API（chat、words 等）在解析 delta 时复用该模块。
 * 演进与TODO：
 *  - 若后续协议新增字段（如 richText、annotations），可在 collectContentSegments 中补充处理分支。
 */

/**
 * 意图：递归收集任意 content/text 结构中的字符串片段，保持原始顺序。
 * 输入：可能为字符串、数组或包含 text/content/messages/segments 的对象。
 * 输出：按出现顺序拼接的字符串数组，供上层 join。
 * 流程：
 *  1) 判空并处理字符串与数组；
 *  2) 针对对象依次采集 text/content/segments/messages；
 *  3) 若对象包含嵌套 message(s)，继续递归；
 * 错误处理：遇到未知类型返回空数组，避免阻塞主流程。
 * 复杂度：O(n)，n 为节点总量。
 */
export function collectContentSegments(value) {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectContentSegments(item));
  }
  if (typeof value === "object") {
    const resolved = [];
    if (typeof value.text === "string") {
      resolved.push(value.text);
    }
    if (typeof value.content === "string") {
      resolved.push(value.content);
    }
    if (
      value.content &&
      typeof value.content === "object" &&
      !Array.isArray(value.content)
    ) {
      resolved.push(...collectContentSegments(value.content));
    }
    if (Array.isArray(value.content)) {
      resolved.push(
        ...value.content.flatMap((item) => collectContentSegments(item)),
      );
    }
    if (Array.isArray(value.segments)) {
      resolved.push(
        ...value.segments.flatMap((item) => collectContentSegments(item)),
      );
    }
    if (typeof value.message === "object" && value.message !== null) {
      resolved.push(
        ...collectContentSegments(value.message.content ?? value.message),
      );
    }
    if (Array.isArray(value.messages)) {
      for (const message of value.messages) {
        resolved.push(...collectContentSegments(message?.content ?? message));
      }
    }
    if (resolved.length > 0) {
      return resolved;
    }
  }
  return [];
}

/**
 * 意图：按照 Doubao 流式协议提取 delta 中的可展示文本。
 * 输入：任意 delta 结构，可包含 message/messages/content 等字段。
 * 输出：拼接后的文本字符串；若无法提取则返回空串。
 * 流程：
 *  1) 收集 message(s) 中的内容；
 *  2) 若仍为空，则降级到 content 字段；
 *  3) 将片段 join 为最终文本。
 * 错误处理：异常时返回空串，由调用方决定是否回退原值。
 * 复杂度：O(n)，n 为 delta 中节点数量。
 */
export function extractTextFromDelta(delta) {
  if (delta == null) {
    return "";
  }
  try {
    const segments = [];
    const messages = Array.isArray(delta.messages)
      ? delta.messages
      : delta.message
        ? [delta.message]
        : [];
    if (messages.length > 0) {
      for (const message of messages) {
        segments.push(...collectContentSegments(message?.content ?? message));
      }
    }
    if (segments.length === 0) {
      segments.push(...collectContentSegments(delta.content ?? delta));
    }
    return segments.join("");
  } catch (error) {
    console.error("[streamingContent] extractTextFromDelta failed", error);
    return "";
  }
}
