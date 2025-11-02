/**
 * 背景：
 *  - 可选音色 DTO 之前存于扁平目录，语音配置难以集中维护。
 * 目的：
 *  - 在 tts 包描述语音选项，方便管理语言与套餐差异。
 * 关键决策与取舍：
 *  - 保持简单数据载体，策略逻辑由服务或配置中心处理。
 * 影响范围：
 *  - 语音列表接口导入路径更新。
 * 演进与TODO：
 *  - 未来支持动态元数据时，可在本包扩展描述字段。
 */
package com.glancy.backend.dto.tts;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a single voice choice available under a language.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VoiceOption {

    /** Unique voice identifier. */
    private String id;

    /** Human readable voice label. */
    private String label;

    /** Subscription plan that can access this voice. */
    private String plan;
}
