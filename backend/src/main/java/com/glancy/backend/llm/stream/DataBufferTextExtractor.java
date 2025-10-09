package com.glancy.backend.llm.stream;

import org.springframework.core.io.buffer.DataBuffer;
import reactor.core.publisher.Flux;

/**
 * 背景：
 *  - WebClient 在 SSE 场景下会以 {@link DataBuffer} 形式逐块推送字节流；直接强转为字符串可能破坏多字节字符。
 * 目的：
 *  - 提供策略接口，将底层字节流安全转换为文本增量，供不同模型的 {@link StreamDecoder} 复用。
 * 关键决策与取舍：
 *  - 采用策略模式允许针对 UTF-8、GBK 等不同编码提供独立实现，避免在客户端硬编码转换细节；
 *  - 接口返回 {@link Flux}，保持上游流式特性，避免一次性聚合导致的延迟或内存压力。
 * 影响范围：
 *  - 目前由 Doubao 客户端使用，后续可在其他模型接入时重用；与现有 StreamDecoder 接口协同工作。
 * 演进与TODO：
 *  - 若未来需要支持二进制帧或压缩编码，可在该接口族内增加新的实现，并在客户端通过配置切换。
 */
public interface DataBufferTextExtractor {
    Flux<String> extract(Flux<DataBuffer> buffers);
}
