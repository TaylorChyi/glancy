package com.glancy.backend.llm.stream.doubao;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - Doubao 流式协议在 delta 节点下嵌套 message/messages/content/segments 等多层结构，
 *    直接在解码器或调用方拼装文本会造成重复逻辑且难以兼容新字段。
 * 目的：
 *  - 提供可复用的内容抽取器，集中处理 Doubao 嵌套节点解析，确保任意调用方均能得到纯文本输出。
 * 关键决策与取舍：
 *  - 采用“组合 + 递归”策略分离遍历逻辑，避免在多个调用方复制粘贴树形解析代码；
 *  - 相较将逻辑留在 DoubaoStreamDecoder 内部，单独抽取类便于后续扩展不同模型或内容类型的提取规则。
 * 影响范围：
 *  - 被流式解码器与 SSE 透传转换策略共同复用，保障前端与持久化路径使用一致的文本抽取结果。
 * 演进与TODO：
 *  - 如后续 Doubao 协议新增富文本节点，可在 collectTextSegments 内扩展支持并考虑引入策略枚举调整优先级。
 */
@Component
public class DoubaoContentExtractor {

    /**
     * 意图：提取 Doubao delta 节点中可展示的文本内容。
     * 输入：包含 Doubao delta 数据的 JsonNode，可能为空或嵌套多层结构。
     * 输出：拼接后的纯文本内容，若无可用文本则返回空字符串。
     * 流程：
     *  1) 按 message/messages/content/segments 等语义字段优先级深度遍历；
     *  2) 收集所有非空文本片段，保持原始顺序拼接；
     * 错误处理：忽略空节点与非文本字段，保证输出稳定；
     * 复杂度：O(n)，n 为节点中子元素数量。
     */
    public String extract(JsonNode delta) {
        if (delta == null || delta.isMissingNode() || delta.isNull()) {
            return "";
        }
        List<String> segments = new ArrayList<>();
        collectTextSegments(delta.path("message"), segments);
        collectTextSegments(delta.path("messages"), segments);
        collectTextSegments(delta.path("content"), segments);
        collectTextSegments(delta.path("segments"), segments);
        if (segments.isEmpty()) {
            collectTextSegments(delta, segments);
        }
        if (segments.isEmpty()) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (String segment : segments) {
            if (segment == null || segment.isEmpty()) {
                continue;
            }
            builder.append(segment);
        }
        return builder.toString();
    }

    private void collectTextSegments(JsonNode node, List<String> segments) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return;
        }
        if (node.isTextual()) {
            String text = node.asText();
            if (!text.isEmpty()) {
                segments.add(text);
            }
            return;
        }
        if (node.isArray()) {
            for (JsonNode child : node) {
                collectTextSegments(child, segments);
            }
            return;
        }
        if (node.isObject()) {
            collectTextSegments(node.get("text"), segments);
            collectTextSegments(node.get("content"), segments);
            collectTextSegments(node.get("segments"), segments);
            collectTextSegments(node.get("message"), segments);
            collectTextSegments(node.get("messages"), segments);
        }
    }
}
