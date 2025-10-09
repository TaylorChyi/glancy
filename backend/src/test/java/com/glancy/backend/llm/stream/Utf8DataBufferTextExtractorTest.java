package com.glancy.backend.llm.stream;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import reactor.core.publisher.Flux;
import reactor.test.StepVerifier;

/**
 * 测试目标：跨 DataBuffer 的 UTF-8 字符应被完整拼接输出，且流结束时若存在残缺编码需抛错。
 * 前置条件：准备表情符号的拆分字节块及异常截断场景。
 * 步骤：
 *  1) 订阅 {@link Utf8DataBufferTextExtractor#extract(Flux)}，输入跨块表情字节；
 *  2) 订阅同一方法，输入被截断的多字节字符。
 * 断言：
 *  - 第一个订阅能输出一次完整的 "😀"；
 *  - 第二个订阅会抛出 {@link StreamDecodeException}，提示截断。
 * 边界/异常：
 *  - 覆盖跨块与截断两类边界。
 */
class Utf8DataBufferTextExtractorTest {

    private final DefaultDataBufferFactory factory = new DefaultDataBufferFactory();
    private final Utf8DataBufferTextExtractor extractor = new Utf8DataBufferTextExtractor();

    @Test
    void decodeMultiByteCharacterAcrossBuffers() {
        DataBuffer part1 = factory.wrap(new byte[] { (byte) 0xF0, (byte) 0x9F });
        DataBuffer part2 = factory.wrap(new byte[] { (byte) 0x98, (byte) 0x80 });

        StepVerifier.create(extractor.extract(Flux.just(part1, part2))).expectNext("😀").verifyComplete();
    }

    @Test
    void raiseErrorWhenStreamEndsWithTruncatedUtf8() {
        DataBuffer part1 = factory.wrap(new byte[] { (byte) 0xE4 });

        StepVerifier.create(extractor.extract(Flux.just(part1))).expectError(StreamDecodeException.class).verify();
    }
}
