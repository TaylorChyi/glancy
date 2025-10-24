/**
 * 背景：
 *  - 语音列表响应原本与聊天、用户 DTO 并列，语音能力边界不清。
 * 目的：
 *  - 在 tts 包提供语音选项返回体，统一语言与默认音色描述。
 * 关键决策与取舍：
 *  - 保留 Jackson 注解匹配外部 API 字段，包划分突出 TTS 场景。
 * 影响范围：
 *  - 语音列表查询接口导入路径更新。
 * 演进与TODO：
 *  - 若后续返回语音预览链接，可在本包扩展字段。
 */
package com.glancy.backend.dto.tts;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response payload describing available voices for a language.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VoiceResponse {

    /** Default voice identifier for the language. */
    @JsonProperty("default")
    private String defaultVoice;

    /** All voice options available. */
    private List<VoiceOption> options;
}
