package com.glancy.backend.service.email.localization;

import java.util.Locale;

/**
 * 背景：
 *  - 邮件验证码需要根据访问者的地理语言环境调整文案，现有实现缺乏灵活扩展点。
 * 目的：
 *  - 定义从客户端上下文推导 {@link Locale} 的策略接口，便于后续扩展多种解析方式。
 * 关键决策与取舍：
 *  - 采用策略模式隔离 IP 映射、外部服务等差异化实现，避免在调用方写死判断逻辑。
 * 影响范围：
 *  - 邮件验证码文案本地化流程；未来可新增 header、账号语言等解析策略。
 * 演进与TODO：
 *  - 可引入基于外部 GeoIP 服务的实现，或支持设备语言的兜底策略。
 */
public interface VerificationLocaleResolver {
    /**
     * 意图：根据客户端上下文信息解析最合适的语言环境。
     * 输入：clientIp（可能为空的字符串，表示客户端来源 IP）。
     * 输出：推导出的 {@link Locale}，若无法识别则返回系统默认语言。
     * 流程：
     *  1) 解析上下文中的 IP 或其他特征；
     *  2) 匹配本地规则或调用外部能力；
     *  3) 若没有命中，则回退默认语言。
     * 错误处理：实现需自行捕获异常并返回默认语言，避免影响主流程。
     * 复杂度：取决于实现，默认应为 O(1)。
     */
    Locale resolve(String clientIp);
}
