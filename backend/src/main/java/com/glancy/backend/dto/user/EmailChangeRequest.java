/**
 * 背景：
 *  - 邮箱换绑确认请求与认证 DTO 并列，导致资料维护流程难以检索。
 * 目的：
 *  - 将邮箱换绑确认载荷放入 user 包，统一账户资料领域模型。
 * 关键决策与取舍：
 *  - 沿用 record 不可变表达，验证逻辑依旧位于服务层。
 * 影响范围：
 *  - 换绑接口调用方需更新导入路径。
 * 演进与TODO：
 *  - 若引入多重验证，可在此扩展验证码类型字段。
 */
package com.glancy.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 换绑邮箱时提交验证码的请求载体。
 */
public record EmailChangeRequest(
    /** 需要绑定的新邮箱地址。 */ @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
    /** 用户收到的邮箱验证码。 */ @NotBlank(message = "验证码不能为空") String code
) {}
