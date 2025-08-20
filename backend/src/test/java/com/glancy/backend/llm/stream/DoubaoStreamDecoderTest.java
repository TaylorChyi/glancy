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

/** 针对抖宝流式事件解析的单元测试。 */
class DoubaoStreamDecoderTest {

    private final DoubaoStreamDecoder decoder = new DoubaoStreamDecoder(new ObjectMapper());

    /**
     * 模拟两个 message 事件与 end 事件，验证解码器按顺序输出内容。
     */
    @Test
    void decodeMessageEvent() {
        String body = """
            event: message
            data: {"choices":[{"delta":{"content":[{"text":"he"}]}}]}

            event: message
            data: {"choices":[{"delta":{"content":[{"text":"llo"}]}}]}

            event: end
            data: {"code":0}

            """;
        Flux<String> flux = decoder.decode(Flux.just(body));
        StepVerifier.create(flux).expectNext("he").expectNext("llo").verifyComplete();
    }

    /**
     * 模拟 message 事件缺失内容字段，验证解析失败并记录 WARN 日志。
     */
    @Test
    void decodeInvalidMessageLogsWarn() {
        Logger logger = (Logger) LoggerFactory.getLogger(DoubaoStreamDecoder.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);

        String body = """
            event: message
            data: {"choices":[{"delta":{}}]}

            event: end
            data: {"code":0}

            """;
        StepVerifier.create(decoder.decode(Flux.just(body))).verifyComplete();
        boolean hasWarn = appender
            .list
            .stream()
            .anyMatch(e -> e.getLevel() == Level.WARN && e.getMessage().contains("Failed to parse"));
        assertTrue(hasWarn);
    }
}
