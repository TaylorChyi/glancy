package com.glancy.backend.llm.stream;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.util.SensitiveDataUtil;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

/** 使用 Reactor 原语按块解析抖宝 SSE 事件。 */
@Slf4j
@Component("doubaoStreamDecoder")
public class DoubaoStreamDecoder implements StreamDecoder {

    private final ObjectMapper mapper;
    private final Map<String, Function<String, Flux<String>>> handlers;

    public DoubaoStreamDecoder(ObjectMapper mapper) {
        this.mapper = mapper;
        Map<String, Function<String, Flux<String>>> map = new HashMap<>();
        map.put("message", this::handleMessage);
        map.put("error", this::handleError);
        map.put("end", data -> Flux.empty());
        this.handlers = Map.copyOf(map);
    }

    @Override
    public Flux<String> decode(Flux<String> rawStream) {
        return splitEvents(rawStream)
            .map(this::toEvent)
            .doOnNext(evt -> log.info("Event [{}]: {}", evt.type, evt.data))
            .takeUntil(evt -> "end".equals(evt.type))
            .flatMap(evt ->
                handlers.containsKey(evt.type)
                    ? handlers.get(evt.type).apply(evt.data.toString())
                    : Flux.empty()
            );
    }

    /** 通过 bufferUntil 检测 \n\n 分隔符，逐事件输出并保留剩余数据。 */
    private Flux<List<String>> splitEvents(Flux<String> source) {
        return Flux.defer(() -> {
            StringBuilder buf = new StringBuilder();
            return source
                .map(buf::append)
                .bufferUntil(sb -> sb.indexOf("\n\n") >= 0)
                .map(list -> {
                    int idx = buf.indexOf("\n\n");
                    String event = buf.substring(0, idx);
                    buf.delete(0, idx + 2);
                    return normalize(event);
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

    private Flux<String> handleMessage(String json) {
        log.info("Handle message event: {}", json);
        if (json == null || json.trim().isEmpty() || "[DONE]".equals(json.trim())) {
            log.warn("Empty message event data, ignoring event: raw={}", SensitiveDataUtil.previewText(json));
            return Flux.empty();
        }
        try {
            JsonNode node = mapper.readTree(json);
            JsonNode delta = node.path("choices").path(0).path("delta");
            String content = delta.path("messages").path(0).path("content").asText();
            if (content.isEmpty()) {
                content = delta.path("content").asText();
            }
            if (content.isEmpty()) {
                log.warn("Message event missing content: {}", SensitiveDataUtil.previewText(json));
                return Flux.empty();
            }
            log.info("Decoded message chunk: {}", SensitiveDataUtil.previewText(content));
            return Flux.just(content);
        } catch (Exception e) {
            log.warn("Failed to decode message event, raw={}", SensitiveDataUtil.previewText(json), e);
            return Flux.empty();
        }
    }

    private Flux<String> handleError(String json) {
        log.info("Handle error event: {}", json);
        try {
            JsonNode node = mapper.readTree(json);
            String msg = node.path("message").asText("Stream error");
            return Flux.error(new IllegalStateException(msg));
        } catch (Exception e) {
            StreamDecodeException ex = new StreamDecodeException("error", json, e);
            log.warn("Failed to decode error event: {}", SensitiveDataUtil.previewText(json), e);
            return Flux.error(ex);
        }
    }

    private static class Event {
        String type;
        StringBuilder data = new StringBuilder();
    }
}
