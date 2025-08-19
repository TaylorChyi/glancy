package com.glancy.backend.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import java.util.function.BiConsumer;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.SynchronousSink;

/**
 * Decodes Doubao Server-Sent Events stream into content fragments.
 * Designed with extensibility so new event types can be registered easily.
 */
@Component
public class DoubaoStreamDecoder {

    private final ObjectMapper mapper;
    private final Map<String, BiConsumer<String, SynchronousSink<String>>> handlers = new HashMap<>();

    public DoubaoStreamDecoder(ObjectMapper mapper) {
        this.mapper = mapper;
        handlers.put("message", this::handleMessage);
        handlers.put("end", this::handleEnd);
    }

    /**
     * Decode raw SSE lines into a flux of content strings.
     */
    public Flux<String> decode(Flux<String> lines) {
        return Flux.defer(() -> {
            AtomicReference<String> currentEvent = new AtomicReference<>();
            return lines.handle((line, sink) -> {
                String trimmed = line.trim();
                if (trimmed.isEmpty()) {
                    // event block finished
                    currentEvent.set(null);
                    return;
                }
                if (trimmed.startsWith("event:")) {
                    currentEvent.set(trimmed.substring(6).trim());
                    return;
                }
                if (trimmed.startsWith("data:")) {
                    String event = currentEvent.get();
                    String data = trimmed.substring(5).trim();
                    BiConsumer<String, SynchronousSink<String>> handler = handlers.get(event);
                    if (handler != null) {
                        handler.accept(data, sink);
                    }
                }
            });
        });
    }

    private void handleMessage(String data, SynchronousSink<String> sink) {
        try {
            JsonNode node = mapper.readTree(data);
            JsonNode content = node.path("choices").get(0).path("delta").path("content");
            if (!content.isMissingNode()) {
                String text = content.asText();
                if (!text.isEmpty()) {
                    sink.next(text);
                }
            }
        } catch (Exception ignored) {
            // ignore malformed data
        }
    }

    private void handleEnd(String data, SynchronousSink<String> sink) {
        sink.complete();
    }
}
