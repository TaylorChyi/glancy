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
        if (lines.size() == 1 && "data: [DONE]".equals(lines.get(0))) {
            return List.of("event: end");
        }
        return lines;
    }

    private List<String> lines(String event) {
        return event.lines().map(String::trim).toList();
    }

    private Event toEvent(List<String> lines) {
        Event evt = new Event();
        for (String line : lines) {
            if (line.startsWith("event:")) {
                evt.type = line.substring(6).trim();
            } else if (line.startsWith("data:")) {
                if (evt.data.length() > 0) {
                    evt.data.append('\n');
                }
                evt.data.append(line.substring(5).trim());
            }
        }
        if (evt.type == null) {
            evt.type = "message";
        }
        return evt;
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
            String content = delta.path("messages").path(0).path("content").asText();
            if (content.isEmpty()) {
                content = delta.path("content").asText();
            }
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
