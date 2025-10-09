package com.glancy.backend.llm.stream;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.concurrent.atomic.AtomicReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * 背景：
 *  - 抖宝等模型返回的 SSE 原始流按字节分块，若直接 `new String(byte[])` 会在多字节字符跨块时产生日文替换符。
 * 目的：
 *  - 以 UTF-8 编码安全地组装跨块字符，确保前端收到的文本与模型输出逐字一致。
 * 关键决策与取舍：
 *  - 选用策略模式适配 {@link DataBufferTextExtractor} 接口，便于未来扩展其他字符集；
 *  - 通过逐块扫描 UTF-8 编码长度识别完整字素，避免引入重量级解码器或一次性聚合；
 *  - 遇到非法编码及时告警并终止流，防止默默丢字造成追踪困难。
 * 影响范围：
 *  - 影响所有依赖 UTF-8 文本输出的流式客户端，目前用于 Doubao；
 *  - 若数据流异常截断会抛出 {@link StreamDecodeException}，调用方可捕获并转化为错误事件。
 * 演进与TODO：
 *  - 后续可引入 ICU4J 以支持更复杂的组合字素统计，当前实现已满足基础 UTF-8 场景。
 */
@Slf4j
@Component("utf8DataBufferTextExtractor")
public class Utf8DataBufferTextExtractor implements DataBufferTextExtractor {

    @Override
    public Flux<String> extract(Flux<DataBuffer> buffers) {
        return Flux.defer(() -> {
            AtomicReference<byte[]> remainderRef = new AtomicReference<>(new byte[0]);
            return buffers
                .map(this::toByteArray)
                .map(bytes -> decodeChunk(bytes, remainderRef))
                .filter(chunk -> !chunk.isEmpty())
                .concatWith(Mono.defer(() -> flushRemainder(remainderRef)));
        });
    }

    private byte[] toByteArray(DataBuffer buffer) {
        byte[] bytes = new byte[buffer.readableByteCount()];
        buffer.read(bytes);
        DataBufferUtils.release(buffer);
        return bytes;
    }

    private String decodeChunk(byte[] incoming, AtomicReference<byte[]> remainderRef) {
        byte[] remainder = remainderRef.get();
        byte[] combined = new byte[remainder.length + incoming.length];
        System.arraycopy(remainder, 0, combined, 0, remainder.length);
        System.arraycopy(incoming, 0, combined, remainder.length, incoming.length);

        int boundary = lastCompleteUtf8Index(combined);
        remainderRef.set(Arrays.copyOfRange(combined, boundary, combined.length));

        if (boundary == 0) {
            return "";
        }
        return new String(combined, 0, boundary, StandardCharsets.UTF_8);
    }

    private Mono<String> flushRemainder(AtomicReference<byte[]> remainderRef) {
        byte[] remainder = remainderRef.getAndSet(new byte[0]);
        if (remainder.length == 0) {
            return Mono.empty();
        }
        int boundary = lastCompleteUtf8Index(remainder);
        if (boundary != remainder.length) {
            String hex = HexFormat.of().formatHex(remainder);
            log.error("Truncated UTF-8 sequence detected at stream end: {}", hex);
            return Mono.error(new StreamDecodeException("utf8", hex, null));
        }
        return Mono.just(new String(remainder, StandardCharsets.UTF_8));
    }

    private int lastCompleteUtf8Index(byte[] data) {
        int i = 0;
        while (i < data.length) {
            int len = utf8SequenceLength(data[i]);
            if (len == 0) {
                log.warn("Invalid UTF-8 start byte detected: {}", data[i]);
                return i;
            }
            if (i + len > data.length) {
                return i;
            }
            for (int j = 1; j < len; j++) {
                if ((data[i + j] & 0xC0) != 0x80) {
                    log.warn("Invalid UTF-8 continuation byte detected at index {}", i + j);
                    return i;
                }
            }
            i += len;
        }
        return i;
    }

    private int utf8SequenceLength(byte firstByte) {
        if ((firstByte & 0b1000_0000) == 0) {
            return 1;
        }
        if ((firstByte & 0b1110_0000) == 0b1100_0000) {
            return 2;
        }
        if ((firstByte & 0b1111_0000) == 0b1110_0000) {
            return 3;
        }
        if ((firstByte & 0b1111_1000) == 0b1111_0000) {
            return 4;
        }
        return 0;
    }
}
