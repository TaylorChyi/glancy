package com.glancy.backend.service.support;

/**
 * 背景：
 *  - 词典查询链路需要统一的键规范以命中缓存，但现有实现仅在 LLM 入口做了归一化，导致服务层仍以原始大小写命中数据库。
 * 目的：
 *  - 抽象词条归一化策略，供服务层与 LLM 编排层共享，确保缓存命中与持久化的键一致。
 * 关键决策与取舍：
 *  - 通过接口隔离具体实现，允许后续根据语言或用户配置切换不同规范化策略；同时避免服务层直接依赖 LLM 具体实现。
 * 影响范围：
 *  - WordService 等使用方将依赖该接口来获取数据库检索所需的规范化词条表示。
 * 演进与TODO：
 *  - 如需支持多语言差异化规则，可新增实现并通过特性开关或策略工厂动态选择。
 */
public interface DictionaryTermNormalizer {
    String normalize(String term);
}
