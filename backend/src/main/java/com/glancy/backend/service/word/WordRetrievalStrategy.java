package com.glancy.backend.service.word;

/**
 * 背景：
 *  - WordService 同时承担同步查询与流式查询两种流程，逻辑膨胀且相互耦合。\
 * 目的：
 *  - 定义策略接口，将不同检索模式解耦成独立实现，方便组合与扩展。\
 * 关键决策与取舍：
 *  - 采用策略模式而非简单工具类，确保后续可以按需新增缓存预热、批量处理等策略；\
 *  - 为维持泛型灵活性使用泛型返回值，缺点是调用方需显式指定类型。\
 * 影响范围：
 *  - WordService 通过注入两个策略实现完成同步/流式查词。\
 * 演进与TODO：
 *  - 可在此接口上扩展元信息（例如指标标签），以便统一监控。
 */
public interface WordRetrievalStrategy<R> {
    R execute(WordQueryContext context);
}
