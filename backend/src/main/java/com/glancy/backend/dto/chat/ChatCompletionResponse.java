/**
 * 背景：
 *  - 聊天补全响应与其他 DTO 混放，难以辨识其 LLM 交互语义。
 * 目的：
 *  - 在 chat 包集中管理聊天相关返回体，确保对接模型服务的边界清晰。
 * 关键决策与取舍：
 *  - 保持 Jackson 注解以兼容第三方响应结构，包划分避免与词典或 TTS 模型混淆。
 * 影响范围：
 *  - ChatController、客户端适配器的导入路径需调整。
 * 演进与TODO：
 *  - 后续若支持多消息格式，可在本包扩展 message 结构或引入策略。
 */
package com.glancy.backend.dto.chat;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChatCompletionResponse {

    private List<Choice> choices;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Choice {

        private Message message;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Message {

        private String role;
        private String content;
    }
}
