package com.glancy.backend.llm.stream;

import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - Doubao SSE 原始事件以多行文本形式返回，服务层直接拼接字符串会导致信息丢失且难以维护。
 * 目的：
 *  - 将原始 SSE 文本解析为结构化事件，既便于后续透传到前端，也能在服务层复用标准协议语义。
 * 关键决策与取舍：
 *  - 采用轻量解析器负责协议字段提取；替代方案是在 WordService 内手写字符串处理，但那会让服务层背负协议细节且重复代码。
 * 影响范围：
 *  - 被 WordService 等编排层注入使用，确保任何需要从 LLM 透传 SSE 的场景都可以共用该解析逻辑。
 * 演进与TODO：
 *  - 后续如需支持多数据字段或评论流，可扩展为组合策略，根据不同模型返回结构解析差异化字段。
 */
@Component
public class SseEventParser {

    /**
     * 意图：解析符合 SSE 协议的文本片段，输出事件类型与数据内容。
     * 输入：原始 SSE 文本，可能包含多行 event/data 字段以及 CRLF 结尾。
     * 输出：成功时返回 {@link SseEvent}，无法解析时返回空 Optional。
     * 流程：
     *  1) 规范化换行符，按行遍历提取字段。
     *  2) 根据协议去除字段后的单个空格，拼接多行数据。
     * 错误处理：
     *  - 非法输入返回 Optional.empty()，调用方可选择回退策略。
     * 复杂度：O(n)，n 为文本长度。
     */
    public Optional<SseEvent> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String normalized = raw.replace("\r\n", "\n").replace('\r', '\n');
        String eventType = null;
        StringBuilder data = new StringBuilder();
        for (String line : normalized.split("\n")) {
            if (line.isEmpty()) {
                continue;
            }
            if (line.startsWith("event:")) {
                eventType = extractFieldValue(line, "event:");
                continue;
            }
            if (line.startsWith("data:")) {
                String value = extractFieldValue(line, "data:");
                if (value != null) {
                    if (data.length() > 0) {
                        data.append('\n');
                    }
                    data.append(value);
                }
            }
        }
        String effectiveEvent = (eventType == null || eventType.isBlank()) ? "message" : eventType.trim();
        if (data.length() == 0 && "message".equals(effectiveEvent)) {
            return Optional.empty();
        }
        return Optional.of(new SseEvent(effectiveEvent, data.toString()));
    }

    private String extractFieldValue(String line, String prefix) {
        String raw = line.substring(prefix.length());
        if (raw.isEmpty()) {
            return "";
        }
        if (raw.charAt(0) == ' ') {
            return raw.substring(1);
        }
        return raw;
    }

    public record SseEvent(String event, String data) {}
}
