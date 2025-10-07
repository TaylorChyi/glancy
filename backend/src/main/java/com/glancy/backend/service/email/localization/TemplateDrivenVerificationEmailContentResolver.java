package com.glancy.backend.service.email.localization;

import com.glancy.backend.config.EmailVerificationProperties;
import com.glancy.backend.service.email.localization.model.LocalizedVerificationContent;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.util.HtmlUtils;

/**
 * 背景：
 *  - 邮件正文需根据语言呈现“验证码：{code}”形式的极简内容。
 * 目的：
 *  - 基于配置模板渲染本地化验证码正文，确保纯文本与 HTML 双版本一致。
 * 关键决策与取舍：
 *  - 通过依赖注入的 {@link VerificationLocaleResolver} 选择语言，保持职责单一；
 *  - 采用配置驱动模板，便于运营快速迭代文案；
 *  - HTML 渲染仅包裹单段落，避免富文本干扰。
 * 影响范围：
 *  - 所有验证码邮件发送逻辑会使用该策略生成正文。
 * 演进与TODO：
 *  - 如需支持多占位符，可引入轻量模板引擎或表达式解析。
 */
@Component
public class TemplateDrivenVerificationEmailContentResolver implements VerificationEmailContentResolver {

    private final VerificationLocaleResolver localeResolver;
    private final Map<String, String> bodyTemplates;
    private final String defaultLanguageTag;

    public TemplateDrivenVerificationEmailContentResolver(
        EmailVerificationProperties properties,
        VerificationLocaleResolver localeResolver
    ) {
        Objects.requireNonNull(properties, "properties");
        this.localeResolver = Objects.requireNonNull(localeResolver, "localeResolver");
        this.bodyTemplates = new LinkedHashMap<>();
        EmailVerificationProperties.Localization localization = properties.getLocalization();
        localization
            .getMessages()
            .forEach((languageTag, message) -> bodyTemplates.put(languageTag, message.getBody().trim()));
        this.defaultLanguageTag = localization.getDefaultLanguageTag();
        Objects.requireNonNull(bodyTemplates.get(defaultLanguageTag), "默认语言模板缺失");
    }

    @Override
    public LocalizedVerificationContent resolve(String clientIp, String code) {
        Locale locale = localeResolver.resolve(clientIp);
        String pattern = resolvePattern(locale).orElseGet(() -> bodyTemplates.get(defaultLanguageTag));
        String rendered = pattern.replace("{{code}}", StringUtils.hasText(code) ? code : "").trim();
        String htmlBody =
            "<p style=\"margin:0; font-size:16px; line-height:1.5; color:#1f2933;\">" +
            HtmlUtils.htmlEscape(rendered) +
            "</p>";
        return new LocalizedVerificationContent(rendered, htmlBody);
    }

    private Optional<String> resolvePattern(Locale locale) {
        String languageTag = locale.toLanguageTag();
        if (bodyTemplates.containsKey(languageTag)) {
            return Optional.of(bodyTemplates.get(languageTag));
        }
        String primary = locale.getLanguage();
        return bodyTemplates
            .entrySet()
            .stream()
            .filter(entry -> entry.getKey().equalsIgnoreCase(primary))
            .map(Map.Entry::getValue)
            .findFirst();
    }
}
