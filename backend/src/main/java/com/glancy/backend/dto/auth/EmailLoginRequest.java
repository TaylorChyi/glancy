/**
 * 背景：
 *  - 原本邮箱验证码登录请求与所有 DTO 混杂，难以追溯认证领域的模型边界。
 * 目的：
 *  - 在 auth 子包内定义邮箱验证码登录载荷，突出其认证场景属性。
 * 关键决策与取舍：
 *  - 沿用 record 表达不可变请求体，同时通过包划分而非类继承实现语义聚合。
 * 影响范围：
 *  - 依赖邮箱验证码登录的控制器与服务需更新导入路径。
 * 演进与TODO：
 *  - 若后续引入短信验证码，可在本包扩展并共享验证策略。
 */
package com.glancy.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for logging in with an email verification code.
 */
public record EmailLoginRequest(
    @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
    @NotBlank(message = "验证码不能为空") String code,
    String deviceInfo
) {}
