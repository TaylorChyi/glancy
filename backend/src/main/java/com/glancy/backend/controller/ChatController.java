package com.glancy.backend.controller;

import com.glancy.backend.dto.ChatRequest;
import com.glancy.backend.dto.ChatResponse;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * 背景：
 *  - 既有接口仅支持 SSE 流式输出，客户端无法按需获取一次性聚合结果。
 * 关键决策与取舍：
 *  - 采用策略模式将“流式/同步”封装为 {@link ChatResponseHandler}，基于 {@link ChatResponseMode}
 *    动态路由，避免多重 @PostMapping 产生的内容协商歧义；
 *  - 除显式响应模式外，保留 Accept 头兜底逻辑，兼容历史客户端。
 * 影响范围：
 *  - chat API 同时兼容流式与非流式调用，前端根据设置切换；
 *  - LLMClientFactory 维持原有职责，仅新增复用辅助方法。
 * 演进与TODO：
 *  - 后续若需扩展更多模式，可在 {@link #buildHandlers()} 注册新处理逻辑。
 */

/**
 * 提供与大语言模型进行流式对话的接口。
 */
@RestController
@Slf4j
public class ChatController {

    private final LLMClientFactory clientFactory;
    private final Map<ChatResponseMode, ChatResponseHandler> handlers;

    public ChatController(LLMClientFactory clientFactory) {
        this.clientFactory = clientFactory;
        this.handlers = buildHandlers();
    }

    @PostMapping(value = "/api/chat", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> chat(@RequestBody ChatRequest request, @RequestHeader HttpHeaders headers) {
        ChatResponseMode mode = resolveMode(request.getResponseMode(), headers);
        log.info("Chat request resolved mode={} for model={}", mode, request.getModel());
        ChatResponseHandler handler = handlers.get(mode);
        if (handler == null) {
            throw new IllegalStateException("No handler registered for mode " + mode);
        }
        return withClient(request, mode, handler::handle);
    }

    private Map<ChatResponseMode, ChatResponseHandler> buildHandlers() {
        Map<ChatResponseMode, ChatResponseHandler> map = new EnumMap<>(ChatResponseMode.class);
        map.put(ChatResponseMode.STREAM, new StreamingChatResponseHandler());
        map.put(ChatResponseMode.SYNC, new SyncChatResponseHandler());
        return map;
    }

    private ChatResponseMode resolveMode(String requestedMode, HttpHeaders headers) {
        return ChatResponseMode.fromRequestValue(requestedMode).orElseGet(() -> {
                List<MediaType> accept = headers != null ? headers.getAccept() : List.of();
                boolean wantsJson = accept.stream().anyMatch(mt -> mt.isCompatibleWith(MediaType.APPLICATION_JSON));
                return wantsJson ? ChatResponseMode.SYNC : ChatResponseMode.STREAM;
            });
    }

    private ResponseEntity<?> withClient(
        ChatRequest request,
        ChatResponseMode mode,
        ChatSessionHandler<ResponseEntity<?>> handler
    ) {
        LLMClient client = clientFactory.get(request.getModel());
        if (client == null) {
            throw new IllegalArgumentException("Unknown model: " + request.getModel());
        }
        List<ChatMessage> messages = request.getMessages() == null ? List.of() : request.getMessages();
        ChatSessionContext context = new ChatSessionContext(client, messages, request.getTemperature(), mode);
        return handler.handle(context);
    }

    @FunctionalInterface
    private interface ChatSessionHandler<T> {
        T handle(ChatSessionContext context);
    }

    private record ChatSessionContext(
        LLMClient client,
        List<ChatMessage> messages,
        double temperature,
        ChatResponseMode mode
    ) {
        int messageCount() {
            return messages.size();
        }
    }

    private interface ChatResponseHandler {
        ResponseEntity<?> handle(ChatSessionContext context);
    }

    private final class StreamingChatResponseHandler implements ChatResponseHandler {

        @Override
        public ResponseEntity<Flux<ServerSentEvent<String>>> handle(ChatSessionContext context) {
            log.info(
                "SSE chat start: model={}, messages={}, mode={}",
                context.client().name(),
                context.messageCount(),
                context.mode()
            );
            Flux<ServerSentEvent<String>> body = context
                .client()
                .streamChat(context.messages(), context.temperature())
                .map(data -> ServerSentEvent.builder(data).build())
                .doOnCancel(() -> log.info("SSE connection cancelled: model={}", context.client().name()))
                .onErrorResume(ex -> {
                    log.error("SSE streaming failed: model={}", context.client().name(), ex);
                    return Flux.just(ServerSentEvent.builder("[ERROR] stream terminated").event("error").build());
                })
                .doFinally(signal -> log.info("SSE stream terminated: {}", signal));
            return ResponseEntity.ok().contentType(MediaType.TEXT_EVENT_STREAM).body(body);
        }
    }

    private final class SyncChatResponseHandler implements ChatResponseHandler {

        @Override
        public ResponseEntity<ChatResponse> handle(ChatSessionContext context) {
            log.info(
                "Sync chat start: model={}, messages={}, mode={}",
                context.client().name(),
                context.messageCount(),
                context.mode()
            );
            String content = context.client().chat(context.messages(), context.temperature());
            log.info("Sync chat completed: model={}, length={}", context.client().name(), content.length());
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(new ChatResponse(content));
        }
    }
}
