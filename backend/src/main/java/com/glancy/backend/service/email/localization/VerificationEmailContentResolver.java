package com.glancy.backend.service.email.localization;

import com.glancy.backend.service.email.localization.model.LocalizedVerificationContent;

public interface VerificationEmailContentResolver {
    /**
     * 意图：根据客户端上下文生成本地化后的验证码邮件正文。
     * 输入：clientIp（可能为空）、code（验证码字符串）。
     * 输出：包含纯文本与 HTML 的渲染结果。
     * 流程：
     *  1) 基于 IP 或其它上下文推导语言；
     *  2) 选择对应模板并完成占位符替换；
     *  3) 生成纯文本与 HTML 两种形态，供邮件服务使用。
     * 错误处理：实现需自行处理异常并返回降级内容，避免影响主流程。
     * 复杂度：默认应为 O(1)。
     */
    LocalizedVerificationContent resolve(String clientIp, String code);
}
