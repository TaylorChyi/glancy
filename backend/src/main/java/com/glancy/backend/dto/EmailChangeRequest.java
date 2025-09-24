package com.glancy.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 换绑邮箱时提交验证码的请求载体。
 */
public record EmailChangeRequest(
    /** 需要绑定的新邮箱地址。 */ @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
    /** 用户收到的邮箱验证码。 */ @NotBlank(message = "验证码不能为空") String code
) {}
