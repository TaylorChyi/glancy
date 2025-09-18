package com.glancy.backend.service.email;

import com.glancy.backend.entity.EmailSuppressionStatus;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Detects mailbox provider specific diagnostics to provide actionable suppression guidance.
 */
@Component
public class MailboxProviderFailureResolver {

    private static final Pattern APPLE_STATUS_PATTERN = Pattern.compile("\\[(CS01|HM07|HM08)\\]");

    public Optional<EmailDeliveryFailure> resolve(String diagnostic) {
        if (!StringUtils.hasText(diagnostic)) {
            return Optional.empty();
        }
        Matcher matcher = APPLE_STATUS_PATTERN.matcher(diagnostic.toUpperCase(Locale.ROOT));
        if (!matcher.find()) {
            return Optional.empty();
        }
        String code = matcher.group(1);
        return Optional.of(
            new EmailDeliveryFailure(true, EmailSuppressionStatus.MANUAL, code, buildAppleDescription(code, diagnostic))
        );
    }

    private String buildAppleDescription(String code, String diagnostic) {
        String hint = switch (code) {
            case "CS01" ->
                "iCloud 拒收代码 CS01，通常意味着内容或身份认证存在风险，请核对 DMARC、SPF、PTR 并保持验证码邮件内容极简";
            case "HM07" ->
                "iCloud 拒收代码 HM07，通常关联发送速率或信誉问题，请降低重试频率并按照 Apple 建议逐步预热专用域/IP";
            case "HM08" ->
                "iCloud 拒收代码 HM08，通常指向反向解析或域名对齐缺失，请确认 PTR、From 域与 DKIM 一致";
            default -> "iCloud 拒收代码 " + code + "，请结合退信原文排查";
        };
        String normalized = StringUtils.hasText(diagnostic) ? diagnostic : "无详细诊断信息";
        return hint + " | 原始诊断：" + normalized;
    }
}
