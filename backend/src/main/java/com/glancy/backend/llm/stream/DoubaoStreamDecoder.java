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

/**
 * 针对抖宝流式事件格式的解析器。通过事件类型与处理器映射，
 * 保持协议扩展的开放性，同时对常见事件进行内聚处理。
 */
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
        return rawStream
            .flatMap(s -> Flux.fromArray(s.split("\n")))
            .map(String::trim)
            .bufferUntil(String::isEmpty)
            .map(this::toEvent)
            .doOnNext(evt -> log.debug("Event [{}]: {}", evt.type, evt.data))
            .takeUntil(evt -> "end".equals(evt.type))
            .flatMap(evt -> {
                if (evt.type == null || !handlers.containsKey(evt.type)) {
                    return Flux.empty();
                }
                return handlers.get(evt.type).apply(evt.data.toString());
            });
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
        log.debug("Handle message event: {}", json);
        try {
            JsonNode node = mapper.readTree(json);
            String content = node.path("choices").path(0).path("delta").path("content").asText();
            return content.isEmpty() ? Flux.empty() : Flux.just(content);
        } catch (Exception e) {
            StreamDecodeException ex = new StreamDecodeException("message", json, e);
            log.warn("Failed to decode message event: {}", SensitiveDataUtil.previewText(json), e);
            return Flux.error(ex);
        }
    }

    private Flux<String> handleError(String json) {
        log.debug("Handle error event: {}", json);
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
