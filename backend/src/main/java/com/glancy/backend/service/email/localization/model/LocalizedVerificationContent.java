package com.glancy.backend.service.email.localization.model;

import java.util.Objects;

/**
 * 背景：
 *  - 邮件发送需同时提供纯文本与 HTML 内容，原有实现返回散乱字符串，难以维护。
 * 目的：
 *  - 以不可变模型封装验证码邮件正文，提升语义化表达与可测试性。
 * 关键决策与取舍：
 *  - 使用 record 提供只读数据结构，简化构造与校验；
 *  - 在构造器中做非空断言，保证调用方获得完整数据。
 * 影响范围：
 *  - 所有验证码邮件内容解析策略输出该模型。
 * 演进与TODO：
 *  - 若未来需附加更多元数据（如语言、格式版本），可新增字段或扩展为类。
 */
public record LocalizedVerificationContent(String plainText, String htmlBody) {
    public LocalizedVerificationContent {
        Objects.requireNonNull(plainText, "plainText");
        Objects.requireNonNull(htmlBody, "htmlBody");
    }
}
