package com.glancy.backend.service.email.localization;

import java.util.Locale;

public interface VerificationLocaleResolver {
    /**
     * 意图：根据客户端上下文信息解析最合适的语言环境。 输入：clientIp（可能为空的字符串，表示客户端来源 IP）。 输出：推导出的 {@link
     * Locale}，若无法识别则返回系统默认语言。 流程： 1) 解析上下文中的 IP 或其他特征； 2) 匹配本地规则或调用外部能力； 3) 若没有命中，则回退默认语言。
     * 错误处理：实现需自行捕获异常并返回默认语言，避免影响主流程。 复杂度：取决于实现，默认应为 O(1)。
     */
    Locale resolve(String clientIp);
}
