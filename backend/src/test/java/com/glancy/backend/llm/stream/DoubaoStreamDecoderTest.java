package com.glancy.backend.llm.stream;

import static org.junit.jupiter.api.Assertions.assertTrue;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;
import reactor.test.StepVerifier;

/**
 * 针对抖宝流式解析的单元测试，覆盖典型事件与异常事件的处理。
 */
class DoubaoStreamDecoderTest {

    private final DoubaoStreamDecoder decoder = new DoubaoStreamDecoder(new ObjectMapper());

    /** 验证标准 message 事件片段能够解析出文本内容。 */
    @Test
    void decodeValidMessageChunk() {
        String body = """
            event: message
            data: {"choices":[{"delta":{"messages":[{"content":"hi"}]}}]}

            event: end
            data: {"code":0}

            """;
        StepVerifier.create(decoder.decode(Flux.just(body))).expectNext("hi").verifyComplete();
    }

    /**
     * 测试目标：验证 content 作为数组返回时会逐项拼接文本并保留换行与前导空格。
     * 前置条件：构造 Doubao delta.messages[0].content 为数组的事件。
     * 步骤：
     *  1) 推送单次 SSE 数据块，内部含有两个 text 元素，分别带有前导空格与换行转义；
     *  2) 订阅输出并消费单个片段；
     * 断言：
     *  - 输出字符串与原始 text 字段一致（包含换行与空格）；
     * 边界/异常：
     *  - 无额外异常路径，重点覆盖数组结构解析。
     */
    @Test
    void decodeContentArrayPreservesFormatting() {
        String body = """
            event: message
            data: {"choices":[{"delta":{"messages":[{"content":[{"type":"text","text":" Leading"},{"type":"text","text":"\\nSpace"}]}]}}]}

            event: end
            data: {"code":0}

            """;

        StepVerifier.create(decoder.decode(Flux.just(body))).expectNext(" Leading\nSpace").verifyComplete();
    }

    /**
     * 测试目标：验证当 content 缺失时能够回退至 message 根节点 text 字段且不做 trim。
     * 前置条件：构造 Doubao 消息仅包含 text 字段的事件。
     * 步骤：
     *  1) 推送单次 SSE 数据块，其中 message 对象直接携带 text；
     *  2) 订阅输出消费片段；
     * 断言：
     *  - 输出字符串保持首尾空格，与 text 原样一致；
     * 边界/异常：
     *  - 兜底逻辑覆盖 message 根级字段。
     */
    @Test
    void decodeFallbackToMessageTextWithoutTrimming() {
        String body = """
            event: message
            data: {"choices":[{"delta":{"messages":[{"text":"  raw text  "}]}}]}

            event: end
            data: {"code":0}

            """;

        StepVerifier.create(decoder.decode(Flux.just(body))).expectNext("  raw text  ").verifyComplete();
    }

    /**
     * 测试目标：验证解码后仍能保留跨 chunk 的前导空格，避免 Markdown 字段被粘连。
     * 前置条件：构造包含前导空格的 Doubao message 事件序列。
     * 步骤：
     *  1) 通过单一 Flux 推送两个 message 事件，第二个事件的 content 以空格开头；
     *  2) 订阅解码器输出并顺序消费两个片段；
     * 断言：
     *  - 第二个片段仍以空格开头，证明解码过程中未被 trim；
     * 边界/异常：
     *  - 场景涵盖最小化事件序列，无额外异常路径。
     */
    @Test
    void preserveLeadingWhitespaceAcrossChunks() {
        String body = """
            event: message
            data: {"choices":[{"delta":{"messages":[{"content":"UsageInsight:"}]}}]}

            event: message
            data: {"choices":[{"delta":{"messages":[{"content":" Introduction"}]}}]}

            event: end
            data: {"code":0}

            """;

        StepVerifier.create(decoder.decode(Flux.just(body)))
            .expectNext("UsageInsight:")
            .expectNext(" Introduction")
            .verifyComplete();
    }

    /** 验证缺少内容的片段会记录 WARN 日志且不输出数据。 */
    @Test
    void decodeInvalidChunkLogsWarn() {
        Logger logger = (Logger) LoggerFactory.getLogger(DoubaoStreamDecoder.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        String body = """
            event: message
            data: {"foo":"bar"}

            event: end
            data: {"code":0}

            """;

        StepVerifier.create(decoder.decode(Flux.just(body))).verifyComplete();

        boolean warned = appender.list
            .stream()
            .anyMatch(
                e -> e.getLevel() == Level.WARN && e.getFormattedMessage().contains("Message event missing content")
            );
        assertTrue(warned);

        logger.detachAppender(appender);
    }

    /**
     * 验证空数据的 message 事件不会终止后续解析，并记录 WARN 日志。
     */
    @Test
    void ignoreEmptyMessageEvent() {
        Logger logger = (Logger) LoggerFactory.getLogger(DoubaoStreamDecoder.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        String body = """
            event: message
            data:

            event: message
            data: {"choices":[{"delta":{"messages":[{"content":"hi"}]}}]}

            event: end
            data: {"code":0}

            """;

        StepVerifier.create(decoder.decode(Flux.just(body))).expectNext("hi").verifyComplete();

        boolean warned = appender.list
            .stream()
            .anyMatch(e -> e.getLevel() == Level.WARN && e.getFormattedMessage().contains("Empty message event data"));
        assertTrue(warned);

        logger.detachAppender(appender);
    }

    /**
     * 验证跨 chunk 的事件能够被正确拼接解析。
     */
    @Test
    void decodeChunkedEvent() {
        Flux<String> chunks = Flux.just(
            "event: message\n",
            "data: {\"choices\":[{\"delta\":{\"messages\":[{\"content\":\"hi\"}]}}]}\n\n",
            "event: end\n",
            "data: {\"code\":0}\n\n"
        );

        StepVerifier.create(decoder.decode(chunks)).expectNext("hi").verifyComplete();
    }

    /** 验证单独的 [DONE] 事件能够正常结束流且不抛异常。 */
    @Test
    void decodeDoneEvent() {
        StepVerifier.create(decoder.decode(Flux.just("data: [DONE]\\n\\n"))).verifyComplete();
    }

    /**
     * 模拟分块 SSE 传输，验证第一事件在后续事件推送前即可被消费。
     * 流程：先推送未完整的 message 事件，再推送其结尾分隔符，
     * StepVerifier 立即收到内容后，再发送下一事件。
     */
    @Test
    void emitFirstChunkBeforeNextArrives() {
        Sinks.Many<String> sink = Sinks.many().unicast().onBackpressureBuffer();
        Flux<String> decoded = decoder.decode(sink.asFlux());

        StepVerifier.create(decoded)
            .then(() -> sink.tryEmitNext("event: message\n" + "data: {\"choices\":[{\"delta\":{\"content\":\"A\"}}]}"))
            .then(() -> sink.tryEmitNext("\n\n"))
            .expectNext("A")
            .then(() ->
                sink.tryEmitNext("event: message\n" + "data: {\"choices\":[{\"delta\":{\"content\":\"B\"}}]}\n\n")
            )
            .expectNext("B")
            .then(() -> sink.tryEmitNext("event: end\n\n"))
            .verifyComplete();
    }

    /**
     * 构造 message + <END> + [DONE] 同帧场景，验证 <END> 可以输出且 endReceived 被标记。
     * 流程：推送包含 message 与 [DONE] 两个事件的单次数据块，期望输出 <END> 并从日志摘要中确认 endReceived=true。
     */
    @Test
    void decodeEndSentinelAndDoneInSameBuffer() {
        Logger logger = (Logger) LoggerFactory.getLogger(DoubaoStreamDecoder.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        String chunk = """
            event: message
            data: {"choices":[{"delta":{"messages":[{"content":"<END>"}]}}]}

            data: [DONE]

            """;

        StepVerifier.create(decoder.decode(Flux.just(chunk))).expectNext("<END>").verifyComplete();

        boolean summaryLogged = appender.list
            .stream()
            .filter(event -> event.getFormattedMessage().contains("Doubao stream decode finished"))
            .anyMatch(
                event ->
                    event.getFormattedMessage().contains("endReceived=true") &&
                    event.getFormattedMessage().contains("events=2")
            );
        assertTrue(summaryLogged, "end signal should be recorded when [DONE] is processed");

        logger.detachAppender(appender);
    }
}
