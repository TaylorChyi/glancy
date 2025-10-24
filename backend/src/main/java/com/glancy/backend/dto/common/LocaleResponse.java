/**
 * 背景：
 *  - 区域信息响应与其他 DTO 混放，国际化接口难以复用统一模型。
 * 目的：
 *  - 在 common 包提供 UI 本地化所需的区域信息载体。
 * 关键决策与取舍：
 *  - 保持轻量数据结构，复杂逻辑交由服务层；包划分凸显通用复用性质。
 * 影响范围：
 *  - LocaleController 等导入路径更新。
 * 演进与TODO：
 *  - 若需补充多语言展示名，可在本包扩展字段。
 */
package com.glancy.backend.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Locale information returned for UI localization.
 */
@Data
@AllArgsConstructor
public class LocaleResponse {

    private String country;
    private String lang;
}
