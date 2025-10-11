package com.glancy.backend.llm.stream.transform;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.springframework.core.annotation.AnnotationAwareOrderComparator;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - WordService 需要根据模型类型选择不同的数据转换策略，若在服务层硬编码选择逻辑将违背开闭原则。
 * 目的：
 *  - 通过注册表集中管理 {@link SsePayloadTransformer} 实现，按顺序挑选匹配策略完成数据转换。
 * 关键决策与取舍：
 *  - 注册表负责排序与匹配，调用方仅关心转换结果，避免散落在多处的策略选择代码；
 *  - 默认回退为透传策略，确保未注册模型保持旧行为可快速回滚。
 * 影响范围：
 *  - 目前由 WordService 使用，后续其他流式接口亦可复用以统一模型扩展方式。
 * 演进与TODO：
 *  - 如需灰度，可结合特性开关或上下文信息扩展 select 逻辑。
 */
@Component
public class SsePayloadTransformerRegistry {

    private final List<SsePayloadTransformer> transformers;

    public SsePayloadTransformerRegistry(List<SsePayloadTransformer> transformers) {
        List<SsePayloadTransformer> ordered = transformers == null ? List.of() : new ArrayList<>(transformers);
        AnnotationAwareOrderComparator.sort(ordered);
        this.transformers = Collections.unmodifiableList(ordered);
    }

    /**
     * 根据模型与事件类型选择合适的策略并转换数据。
     *
     * @param model LLM 模型的客户端标识。
     * @param event SSE 事件类型，允许为 null。
     * @param data 原始 data 内容。
     * @return 转换后的 data 字段，若无匹配策略则原样返回。
     */
    public String transform(String model, String event, String data) {
        if (data == null) {
            return null;
        }
        return transformers
            .stream()
            .filter(transformer -> transformer.supports(model))
            .findFirst()
            .map(transformer -> transformer.transform(event, data))
            .orElse(data);
    }
}
