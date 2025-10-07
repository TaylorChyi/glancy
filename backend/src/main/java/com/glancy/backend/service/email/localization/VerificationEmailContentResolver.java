package com.glancy.backend.service.email.localization;

import com.glancy.backend.service.email.localization.model.LocalizedVerificationContent;

/**
 * 背景：
 *  - 邮件验证码文案需要支持多语言渲染，且可能存在不同生成策略（配置、模板引擎、外部服务）。
 * 目的：
 *  - 通过策略接口统一验证码正文的渲染入口，便于在不影响调用方的情况下切换实现。
 * 关键决策与取舍：
 *  - 输出统一封装类，保证同时提供纯文本与 HTML 版本，避免调用方重复处理转义；
 *  - 仅接受最少上下文（IP、验证码），后续若需更多参数可通过扩展对象承载。
 * 影响范围：
 *  - 邮件发送流程在调用该接口获取最终正文内容。
 * 演进与TODO：
 *  - 可扩展支持 A/B 测试、品牌定制等高级渲染逻辑。
 */
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
