package com.glancy.backend.llm.stream.transform;

/**
 * 背景：
 *  - 不同模型在 SSE data 字段中嵌套的结构各异，直接在服务层分支判断会导致代码膨胀且难以演进。
 * 目的：
 *  - 定义统一的转换策略接口，借助策略模式让各模型独立实现数据透传或改写逻辑，保持编排层纯净。
 * 关键决策与取舍：
 *  - 选择策略模式而非简单 if/else，便于未来扩展更多模型时仅新增实现类；
 *  - 接口以模型标识为选择因子，避免服务层硬编码模型名称。
 * 影响范围：
 *  - WordService 等编排组件将通过注册表动态选择策略，前端收到的数据结构因此保持稳定。
 * 演进与TODO：
 *  - 后续可结合权重或特性开关实现灰度切换不同策略实现。
 */
public interface SsePayloadTransformer {
    /**
     * 判定当前策略是否支持给定模型标识。
     *
     * @param model LLM 模型的客户端标识，需为非空字符串。
     * @return 支持返回 true，反之 false。
     */
    boolean supports(String model);

    /**
     * 意图：对 SSE 事件数据进行模型特定的转换。
     *
     * @param event SSE 事件类型，允许为 null 表示默认 message。
     * @param data 原始 data 字段内容，可能为 JSON 或纯文本。
     * @return 转换后的数据，调用方可直接透传给前端。
     */
    String transform(String event, String data);
}
