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
