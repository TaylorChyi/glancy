package com.glancy.backend.service.email.localization;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.service.email.localization.model.LocalizedVerificationContent;
import java.util.LinkedHashMap;
import java.util.Locale;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;


class TemplateDrivenVerificationEmailContentResolverTest {

    private EmailVerificationProperties properties;

    @BeforeEach
    void setUp() {
        properties = new EmailVerificationProperties();
        EmailVerificationProperties.Localization localization = properties.getLocalization();
        localization.setDefaultLanguageTag("zh-CN");
        LinkedHashMap<String, EmailVerificationProperties.Localization.Message> messages = new LinkedHashMap<>();
        messages.put("zh-CN", createMessage("验证码：{{code}}"));
        messages.put("ja-JP", createMessage("認証コード：{{code}}"));
        messages.put("en-US", createMessage("Verification code: {{code}}"));
        localization.setMessages(messages);
    }

    /**
     * 测试目标：当解析出的语言为日语时返回日语验证码文案。
     * 前置条件：配置中包含 zh-CN、ja-JP 模板，默认语言 zh-CN。
     * 步骤：
     *  1) 构造固定返回日语 Locale 的解析器；
     *  2) 调用渲染器生成内容。
     * 断言：
     *  - 纯文本为 "認証コード：123456"；
     *  - HTML 包含同样的内容。
     * 边界/异常：
     *  - 无特别边界。
     */
    @Test
    void Given_JapaneseLocale_When_Resolve_Then_ReturnJapaneseMessage() {
        VerificationEmailContentResolver resolver = new TemplateDrivenVerificationEmailContentResolver(
            properties,
            ignored -> Locale.forLanguageTag("ja-JP")
        );

        LocalizedVerificationContent content = resolver.resolve("203.0.113.10", "123456");

        assertEquals("認証コード：123456", content.plainText());
        assertEquals(
            "<p style=\"margin:0; font-size:16px; line-height:1.5; color:#1f2933;\">認証コード：123456</p>",
            content.htmlBody()
        );
    }

    /**
     * 测试目标：当解析出的语言缺失模板时回退到默认语言。
     * 前置条件：默认语言为 zh-CN，且缺少 fr-FR 模板。
     * 步骤：
     *  1) 构造固定返回法语 Locale 的解析器；
     *  2) 调用渲染器生成内容。
     * 断言：
     *  - 纯文本回退为中文模板；
     *  - HTML 同样为中文内容。
     * 边界/异常：
     *  - 验证回退逻辑。
     */
    @Test
    void Given_MissingLocale_When_Resolve_Then_FallBackToDefault() {
        VerificationEmailContentResolver resolver = new TemplateDrivenVerificationEmailContentResolver(
            properties,
            ignored -> Locale.forLanguageTag("fr-FR")
        );

        LocalizedVerificationContent content = resolver.resolve("198.51.100.2", "654321");

        assertEquals("验证码：654321", content.plainText());
        assertEquals(
            "<p style=\"margin:0; font-size:16px; line-height:1.5; color:#1f2933;\">验证码：654321</p>",
            content.htmlBody()
        );
    }

    private EmailVerificationProperties.Localization.Message createMessage(String body) {
        EmailVerificationProperties.Localization.Message message =
            new EmailVerificationProperties.Localization.Message();
        message.setBody(body);
        return message;
    }
}
