/**
 * 背景：
 *  - 区域信息响应与其他 DTO 混放，国际化接口难以复用统一模型。
 * 目的：
 *  - 在 common 包提供 UI 本地化所需的区域信息载体。
 * 关键决策与取舍：
 *  - 保持轻量数据结构，复杂逻辑交由服务层；包划分凸显通用复用性质。
 *  - 采用 record 实现不可变模型，同时兼容历史字段名 lang，降低前端改动成本。
 * 影响范围：
 *  - LocaleController 等导入路径更新。
 * 演进与TODO：
 *  - 若需补充多语言展示名，可在本包扩展字段。
 */
package com.glancy.backend.dto.common;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Locale information returned for UI localization.
 */
public record LocaleResponse(String country, @JsonProperty("language") String language) {
    /**
     * 提供旧字段名 "lang" 的 JSON 映射，确保已有客户端仍可读取。
     */
    @JsonProperty("lang")
    public String legacyLang() {
        return language;
    }
}
