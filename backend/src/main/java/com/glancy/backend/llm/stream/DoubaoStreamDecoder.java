package com.glancy.backend.llm.stream;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.util.SensitiveDataUtil;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

/** 使用 Reactor 原语按块解析抖宝 SSE 事件。 */
@Slf4j
@Component("doubaoStreamDecoder")
public class DoubaoStreamDecoder implements StreamDecoder {

    private final ObjectMapper mapper;

    public DoubaoStreamDecoder(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public Flux<String> decode(Flux<String> rawStream) {
        StreamState state = new StreamState();
        return splitEvents(rawStream)
            .map(this::toEvent)
            .doOnNext(state::recordEvent)
            .takeUntil(evt -> "end".equals(evt.type))
            .concatMap(evt -> handleEvent(evt, state))
            .doFinally(signal -> log.info("Doubao stream decode finished with signal {}. {}", signal, state.summary()));
    }

    /** 通过循环解析全部完整的 \n\n 分隔事件，并在流结束时冲刷剩余数据。 */
    private Flux<List<String>> splitEvents(Flux<String> source) {
        return Flux.defer(() -> {
            StringBuilder buf = new StringBuilder();
            return Flux.concat(source, Flux.just("\n\n")).flatMapIterable(chunk -> {
                    buf.append(chunk);
                    List<List<String>> events = new ArrayList<>();
                    int idx;
                    while ((idx = buf.indexOf("\n\n")) >= 0) {
                        String event = buf.substring(0, idx);
                        buf.delete(0, idx + 2);
                        if (!event.isEmpty()) {
                            events.add(normalize(event));
                        }
                    }
                    return events;
                });
        });
    }

    private List<String> normalize(String event) {
        List<String> lines = lines(event);
        if (lines.size() == 1 && "data: [DONE]".equals(lines.get(0).strip())) {
            return List.of("event: end");
        }
        return lines;
    }

    private List<String> lines(String event) {
        return event.lines().toList();
    }

    private Event toEvent(List<String> lines) {
        Event evt = new Event();
        for (String line : lines) {
            String eventType = extractFieldValue(line, "event:");
            if (eventType != null) {
                evt.type = eventType.strip();
                continue;
            }

            String dataPayload = extractFieldValue(line, "data:");
            if (dataPayload != null) {
                if (evt.data.length() > 0) {
                    evt.data.append('\n');
                }
                evt.data.append(dataPayload);
            }
        }
        if (evt.type == null) {
            evt.type = "message";
        }
        return evt;
    }

    /**
     * 背景：
     *  - Doubao SSE 片段中的内容存在前导空格以维持 Markdown 间距；原实现直接 trim 会造成语句粘连。
     * 目的：
     *  - 仅剥离字段名前缀及其后约定的单个空格，其余字符一律保留，保证流式文本精确传递。
     * 关键决策与取舍：
     *  - 复用同一解析函数处理 event/data 等字段，避免在主循环内散布字符串操作；
     *  - 使用 strip/substring 而非正则，确保在高频流式场景下性能稳定。
     */
    private String extractFieldValue(String line, String prefix) {
        if (!line.startsWith(prefix)) {
            return null;
        }
        String raw = line.substring(prefix.length());
        if (!raw.isEmpty() && raw.charAt(0) == ' ') {
            return raw.substring(1);
        }
        return raw;
    }

    private Flux<String> handleEvent(Event evt, StreamState state) {
        return switch (evt.type) {
            case "message" -> handleMessage(evt.data.toString(), state);
            case "error" -> handleError(evt.data.toString(), state);
            case "end" -> {
                state.markEnd();
                yield Flux.empty();
            }
            default -> Flux.empty();
        };
    }

    private Flux<String> handleMessage(String json, StreamState state) {
        log.info("Handle message event: {}", json);
        if (json == null || json.trim().isEmpty() || "[DONE]".equals(json.trim())) {
            log.warn("Empty message event data, ignoring event: raw={}", SensitiveDataUtil.previewText(json));
            state.incrementEmptyPayload();
            return Flux.empty();
        }
        try {
            JsonNode node = mapper.readTree(json);
            JsonNode choice = node.path("choices").path(0);
            state.inspectChoice(choice);
            JsonNode delta = choice.path("delta");
            String content = extractDisplayText(delta);
            if (content.isEmpty()) {
                state.incrementEmptyPayload();
                log.warn("Message event missing content: {}", SensitiveDataUtil.previewText(json));
                return Flux.empty();
            }
            state.registerChunk(content);
            if (state.hasFinishReason()) {
                log.warn(
                    "Received content chunk after finish reason '{}': {}",
                    state.getFinishReason(),
                    SensitiveDataUtil.previewText(content)
                );
            }
            log.info("Decoded message chunk: {}", SensitiveDataUtil.previewText(content));
            return Flux.just(content);
        } catch (Exception e) {
            state.incrementDecodeFailure();
            log.warn("Failed to decode message event, raw={}", SensitiveDataUtil.previewText(json), e);
            return Flux.empty();
        }
    }

    /**
     * 背景：
     *  - Doubao 新版协议会以 message/messages/content 嵌套数组的形式返回结构化片段，
     *    若直接取某个字段将出现 JSON 串被前端透出的问题。
     * 目的：
     *  - 通过“模板方法 + 递归组合”收集所有可展示文本字段，屏蔽不同层级的差异，确保流式输出恒为纯文本。
     * 关键决策与取舍：
     *  - 仅枚举 text/content/segments/message(s) 等语义字段，避免误采集 role/type 等元信息；
     *  - 通过顺序遍历保持模型原始片段的先后顺序，不在此处插入额外空格，由上层 formatter 控制排版。
     */
    private String extractDisplayText(JsonNode delta) {
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

    /**
     * 意图：深度优先遍历 Doubao 结构化节点，抽取其中的纯文本片段。
     * 输入：当前节点（可能为文本、数组或对象）以及聚合结果容器。
     * 输出：无直接返回值，片段会追加到 segments 列表中。
     * 流程：
     *  1) 若节点为文本则直接采集；
     *  2) 若为数组则顺序遍历递归子节点；
     *  3) 若为对象则按 text/content/segments/message(s) 顺序递归处理；
     * 错误处理：忽略空节点及非文本字段，避免污染展示结果。
     */
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

    private Flux<String> handleError(String json, StreamState state) {
        log.info("Handle error event: {}", json);
        try {
            JsonNode node = mapper.readTree(json);
            String msg = node.path("message").asText("Stream error");
            state.markError(msg);
            return Flux.error(new IllegalStateException(msg));
        } catch (Exception e) {
            StreamDecodeException ex = new StreamDecodeException("error", json, e);
            state.markError(e.getMessage());
            log.warn("Failed to decode error event: {}", SensitiveDataUtil.previewText(json), e);
            return Flux.error(ex);
        }
    }

    private static class Event {

        String type;
        StringBuilder data = new StringBuilder();
    }

    private class StreamState {

        private final Instant startedAt = Instant.now();
        private int eventCount;
        private int chunkCount;
        private int totalChars;
        private int emptyPayloadCount;
        private int decodeFailures;
        private boolean endReceived;
        private boolean finishReasonReceived;
        private String finishReason;
        private String lastChunkPreview;
        private String errorMessage;

        void recordEvent(Event evt) {
            if (endReceived) {
                log.warn(
                    "Received event '{}' after end signal, raw={}",
                    evt.type,
                    SensitiveDataUtil.previewText(evt.data.toString())
                );
            }
            eventCount++;
            log.info("Event [{}]: {}", evt.type, evt.data);
        }

        void inspectChoice(JsonNode choice) {
            JsonNode finish = choice.path("finish_reason");
            if (finish.isMissingNode() || finish.isNull()) {
                return;
            }
            String reason = finish.asText();
            if (reason == null || reason.isBlank()) {
                return;
            }
            if (!finishReasonReceived) {
                finishReasonReceived = true;
                finishReason = reason;
                log.info("Finish reason '{}' received from Doubao stream", reason);
            }
        }

        void registerChunk(String chunk) {
            chunkCount++;
            totalChars += chunk.length();
            lastChunkPreview = SensitiveDataUtil.previewText(chunk);
        }

        void incrementEmptyPayload() {
            emptyPayloadCount++;
        }

        void incrementDecodeFailure() {
            decodeFailures++;
        }

        void markError(String message) {
            if (message != null && !message.isBlank()) {
                errorMessage = message;
            }
        }

        void markEnd() {
            endReceived = true;
        }

        boolean hasFinishReason() {
            return finishReasonReceived;
        }

        String getFinishReason() {
            return finishReason;
        }

        String summary() {
            long duration = Duration.between(startedAt, Instant.now()).toMillis();
            return String.format(
                "events=%d, chunks=%d, totalChars=%d, emptyPayloads=%d, decodeFailures=%d, finishReason=%s, " +
                "endReceived=%s, lastChunk=%s, error=%s, durationMs=%d",
                eventCount,
                chunkCount,
                totalChars,
                emptyPayloadCount,
                decodeFailures,
                finishReasonReceived ? finishReason : "<none>",
                endReceived,
                lastChunkPreview != null ? lastChunkPreview : "<none>",
                errorMessage != null ? SensitiveDataUtil.previewText(errorMessage) : "<none>",
                duration
            );
        }
    }
}
