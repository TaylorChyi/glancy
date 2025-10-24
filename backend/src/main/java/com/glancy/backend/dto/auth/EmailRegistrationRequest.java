/**
 * 背景：
 *  - 邮箱注册请求与所有 DTO 混在同一目录，难以从文件结构判断认证注册流程。
 * 目的：
 *  - 将邮箱注册载荷归档至 auth 包，体现其身份注册语义并方便共用验证规则。
 * 关键决策与取舍：
 *  - 维持 record 不可变特性，同时通过包划分避免复制任何业务逻辑。
 * 影响范围：
 *  - Registration 相关 controller/service 的导入路径更新为 auth 子包。
 * 演进与TODO：
 *  - 如需区分企业与个人注册，可在本包内扩展专用 DTO 并复用通用字段。
 */
package com.glancy.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload submitted when registering via email verification.
 */
public record EmailRegistrationRequest(
    @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
    @NotBlank(message = "验证码不能为空") String code,
    @NotBlank(message = "用户名不能为空") @Size(min = 3, max = 50, message = "用户名长度需在3到50之间") String username,
    @NotBlank(message = "密码不能为空") @Size(min = 6, message = "密码长度至少为6位") String password,
    String avatar,
    @NotBlank(message = "手机号不能为空") String phone
) {}
