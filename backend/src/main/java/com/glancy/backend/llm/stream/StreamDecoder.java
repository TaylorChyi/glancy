package com.glancy.backend.llm.stream;

import reactor.core.publisher.Flux;

/**
 * 将不同厂商返回的流式原始片段解析成可消费的内容片段。
 * 实现类专注于协议与格式差异，业务层得以保持统一抽象。
 */
public interface StreamDecoder {
    Flux<String> decode(Flux<String> rawStream);
}
