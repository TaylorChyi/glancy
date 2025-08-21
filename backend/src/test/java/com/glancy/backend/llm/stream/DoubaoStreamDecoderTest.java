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
import reactor.test.StepVerifier;

/**
 * 针对抖宝流式解析的单元测试，覆盖典型事件与异常事件的处理。
 */
class DoubaoStreamDecoderTest {

    private final DoubaoStreamDecoder decoder = new DoubaoStreamDecoder(new ObjectMapper());

    /** 验证标准 message 事件片段能够解析出文本内容。 */
    @Test
    void decodeValidMessageChunk() {
        String body =
            """
            event: message
            data: {"choices":[{"delta":{"messages":[{"content":"hi"}]}}]}

            event: end
            data: {"code":0}

            """;
        StepVerifier.create(decoder.decode(Flux.just(body))).expectNext("hi").verifyComplete();
    }

    /** 验证缺少内容的片段会记录 WARN 日志且不输出数据。 */
    @Test
    void decodeInvalidChunkLogsWarn() {
        Logger logger = (Logger) LoggerFactory.getLogger(DoubaoStreamDecoder.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        String body =
            """
            event: message
            data: {"foo":"bar"}

            event: end
            data: {"code":0}

            """;

        StepVerifier.create(decoder.decode(Flux.just(body))).verifyComplete();

        boolean warned = appender.list.stream()
            .anyMatch(e -> e.getLevel() == Level.WARN && e.getFormattedMessage().contains("Message event missing content"));
        assertTrue(warned);

        logger.detachAppender(appender);
    }
}

