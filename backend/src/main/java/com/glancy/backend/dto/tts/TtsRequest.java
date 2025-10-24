/**
 * 背景：
 *  - 文本转语音请求 DTO 之前与聊天、用户模型混在一起，语音合成场景难以聚合。
 * 目的：
 *  - 在 tts 包集中描述语音合成输入契约，方便不同通道共享。
 * 关键决策与取舍：
 *  - 维持字段不可变语义并保留可扩展枚举，包划分避免与其他音频功能混淆。
 * 影响范围：
 *  - TTS 控制器、服务及客户端导入路径更新。
 * 演进与TODO：
 *  - 若后续支持批量合成，可在本包新增集合型 DTO 或命令模式。
 */
package com.glancy.backend.dto.tts;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Request payload for text to speech synthesis. Shared by both
 * word and sentence endpoints.
 */
@Data
public class TtsRequest {

    /** Text content to synthesize. */
    @NotBlank
    private String text;

    /** Language code, e.g. "en-US". */
    @NotBlank
    private String lang;

    /** Voice identifier within the language. */
    private String voice;

    /**
     * Audio format. Currently only mp3 is supported but expressed
     * as a field to keep the contract extensible.
     */
    @Pattern(regexp = "mp3", message = "Only mp3 format is supported")
    private String format = "mp3";

    /** Playback speed multiplier. */
    @DecimalMin("0.5")
    @DecimalMax("2.0")
    private double speed = 1.0;

    /**
     * When true, the backend returns 204 if cache is missed allowing
     * the client to decide whether to trigger synthesis.
     */
    private boolean shortcut = true;

    /**
     * Operation mode for the upstream API. {@code QUERY} performs a
     * synchronous HTTP request while {@code SUBMIT} enables streaming.
     */
    @NotNull
    private Operation operation = Operation.QUERY;

    /**
     * Supported operations understood by the Volcengine API.
     */
    public enum Operation {
        QUERY,
        SUBMIT;

        /** Returns lowercase API representation. */
        public String apiValue() {
            return name().toLowerCase();
        }
    }
}
