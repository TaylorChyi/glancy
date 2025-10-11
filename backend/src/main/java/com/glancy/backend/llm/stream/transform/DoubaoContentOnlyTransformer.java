package com.glancy.backend.llm.stream.transform;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.entity.DictionaryModel;
import com.glancy.backend.llm.stream.doubao.DoubaoContentExtractor;
import com.glancy.backend.util.SensitiveDataUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - Doubao SSE 的 data 字段返回完整消息体 JSON，直接透传会让前端承担解析职责并暴露协议细节。
 * 目的：
 *  - 借助策略模式将 Doubao 的数据清洗逻辑封装为独立实现，只保留 content 字段文本供前端渲染。
 * 关键决策与取舍：
 *  - 通过注入 {@link DoubaoContentExtractor} 复用现有的树遍历逻辑，避免重复维护；
 *  - 解析失败时回退原始数据并记录告警，确保在协议变动时仍能观察异常而不致于完全丢失信息。
 * 影响范围：
 *  - 仅对 Doubao 模型的 message 事件生效，其他模型或事件类型保持原样透传。
 * 演进与TODO：
 *  - 若 Doubao 后续引入富文本或多模态字段，可在此处扩展格式降级策略或结合特性开关灰度发布。
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class DoubaoContentOnlyTransformer implements SsePayloadTransformer {

    private static final String MESSAGE_EVENT = "message";

    private final ObjectMapper objectMapper;
    private final DoubaoContentExtractor contentExtractor;

    public DoubaoContentOnlyTransformer(ObjectMapper objectMapper, DoubaoContentExtractor contentExtractor) {
        this.objectMapper = objectMapper;
        this.contentExtractor = contentExtractor;
    }

    @Override
    public boolean supports(String model) {
        return DictionaryModel.DOUBAO.getClientName().equals(model);
    }

    @Override
    public String transform(String event, String data) {
        if (data == null || data.isBlank()) {
            return data;
        }
        String effectiveEvent = event == null ? MESSAGE_EVENT : event;
        if (!MESSAGE_EVENT.equals(effectiveEvent)) {
            return data;
        }
        try {
            JsonNode node = parsePayload(data);
            JsonNode delta = node.path("choices").path(0).path("delta");
            String extracted = contentExtractor.extract(delta);
            return extracted.isEmpty() ? data : extracted;
        } catch (Exception ex) {
            log.warn(
                "Failed to transform Doubao payload, fallback to original body: {}",
                SensitiveDataUtil.previewText(data),
                ex
            );
            return data;
        }
    }

    /**
     * 意图：兼容 Doubao SSE 在 data 字段中返回的双重转义 JSON 片段。
     * 输入：原始 data 文本，可能是合法 JSON 或包含反斜杠转义的 JSON 字符串。
     * 输出：可供 Jackson 解析的 JsonNode；若两轮解析均失败则抛出首个异常。
     * 流程：
     *  1) 首先直接解析原始文本；
     *  2) 失败时尝试调用 {@link String#translateEscapes()} 解开结构性转义并再次解析；
     * 错误处理：无法解码时保留首个解析异常交由调用方记录告警；
     * 复杂度：O(n)，n 为文本长度，用于二次遍历字符串。
     */
    private JsonNode parsePayload(String data) throws JsonProcessingException {
        try {
            return objectMapper.readTree(data);
        } catch (JsonProcessingException firstFailure) {
            String normalized = tryNormalizeEscapedJson(data);
            if (normalized.equals(data)) {
                throw firstFailure;
            }
            try {
                return objectMapper.readTree(normalized);
            } catch (JsonProcessingException secondFailure) {
                secondFailure.addSuppressed(firstFailure);
                throw secondFailure;
            }
        }
    }

    private String tryNormalizeEscapedJson(String data) {
        if (data == null || data.indexOf("\\") < 0) {
            return data;
        }
        try {
            return data.translateEscapes();
        } catch (IllegalArgumentException ignored) {
            return unescapeQuotesAndSlashes(data);
        }
    }

    private String unescapeQuotesAndSlashes(String data) {
        StringBuilder builder = new StringBuilder(data.length());
        boolean escaping = false;
        for (int i = 0; i < data.length(); i++) {
            char ch = data.charAt(i);
            if (escaping) {
                if (ch == '"' || ch == '\\') {
                    builder.append(ch);
                } else {
                    builder.append('\\').append(ch);
                }
                escaping = false;
                continue;
            }
            if (ch == '\\') {
                escaping = true;
                continue;
            }
            builder.append(ch);
        }
        if (escaping) {
            builder.append('\\');
        }
        return builder.toString();
    }
}
