/**
 * 背景：
 *  - 语音合成响应与其他领域 DTO 混放，难以识别音频输出契约。
 * 目的：
 *  - 在 tts 包聚合合成结果，统一缓存与格式元信息表达。
 * 关键决策与取舍：
 *  - 延续 Jackson 注解保证字段命名兼容，包划分避免与聊天响应混淆。
 * 影响范围：
 *  - TTS 控制器和客户端导入路径更新。
 * 演进与TODO：
 *  - 如需返回多段音频或字幕，可在本包扩展结构。
 */
package com.glancy.backend.dto.tts;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Encapsulates synthesized audio bytes and related metadata.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TtsResponse {

    /** Raw audio data. */
    @JsonProperty("data")
    private byte[] data;

    /** Audio duration in milliseconds. */
    @JsonProperty("duration_ms")
    private long durationMs;

    /** Audio format such as mp3. */
    private String format;

    /** Indicates whether the result was served from cache. */
    @JsonProperty("from_cache")
    private boolean fromCache;
}
