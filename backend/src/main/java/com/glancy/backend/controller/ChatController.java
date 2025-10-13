package com.glancy.backend.controller;

import com.glancy.backend.dto.ChatRequest;
import com.glancy.backend.dto.ChatResponse;
import com.glancy.backend.llm.llm.LLMClient;
import com.glancy.backend.llm.llm.LLMClientFactory;
import com.glancy.backend.llm.model.ChatMessage;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * 背景：
 *  - 既有接口仅支持 SSE 流式输出，客户端无法按需获取一次性聚合结果。
 * 关键决策与取舍：
 *  - 引入同步 JSON 输出接口，沿用原有流式路径，通过私有模板方法统一模型选择与日志上下文。
 *  - 相比拆分新控制器，复用同一路由便于前端通过 Accept 头自适应选择模式。
 * 影响范围：
 *  - chat API 同时兼容流式与非流式调用，前端根据设置切换；
 *  - LLMClientFactory 维持原有职责，仅新增复用辅助方法。
 * 演进与TODO：
 *  - 后续若需扩展更多模式，可在 {@link #withClient(ChatRequest, ChatSessionHandler)} 注册新处理逻辑。
 */

/**
 * 提供与大语言模型进行流式对话的接口。
 */
@RestController
@Slf4j
public class ChatController {

    private final LLMClientFactory clientFactory;

    public ChatController(LLMClientFactory clientFactory) {
        this.clientFactory = clientFactory;
    }

    /**
     * 以 Server-Sent Events 方式流式返回模型响应。连接关闭或出现异常时，
     * 会记录日志并优雅结束输出。
     */
    @PostMapping(value = "/api/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> chat(@RequestBody ChatRequest request) {
        return withClient(request, context -> {
            log.info("SSE chat start: model={}, messages={}", context.client().name(), context.messageCount());
            return context
                .client()
                .streamChat(context.messages(), context.temperature())
                .map(data -> ServerSentEvent.builder(data).build())
                .doOnCancel(() -> log.info("SSE connection cancelled: model={}", context.client().name()))
                .onErrorResume(ex -> {
                    log.error("SSE streaming failed: model={}", context.client().name(), ex);
                    return Flux.just(ServerSentEvent.builder("[ERROR] stream terminated").event("error").build());
                })
                .doFinally(signal -> log.info("SSE stream terminated: {}", signal));
        });
    }

    @PostMapping(
        value = "/api/chat",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ChatResponse chatSync(@RequestBody ChatRequest request) {
        return withClient(request, context -> {
            log.info("Sync chat start: model={}, messages={}", context.client().name(), context.messageCount());
            String content = context.client().chat(context.messages(), context.temperature());
            log.info("Sync chat completed: model={}, length={}", context.client().name(), content.length());
            return new ChatResponse(content);
        });
    }

    private <T> T withClient(ChatRequest request, ChatSessionHandler<T> handler) {
        LLMClient client = clientFactory.get(request.getModel());
        if (client == null) {
            throw new IllegalArgumentException("Unknown model: " + request.getModel());
        }
        List<ChatMessage> messages = request.getMessages() == null ? List.of() : request.getMessages();
        ChatSessionContext context = new ChatSessionContext(client, messages, request.getTemperature());
        return handler.handle(context);
    }

    @FunctionalInterface
    private interface ChatSessionHandler<T> {
        T handle(ChatSessionContext context);
    }

    private record ChatSessionContext(LLMClient client, List<ChatMessage> messages, double temperature) {
        int messageCount() {
            return messages.size();
        }
    }
}
