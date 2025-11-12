package com.glancy.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Payload submitted when registering via email verification. */
public record EmailRegistrationRequest(
    @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
    @NotBlank(message = "验证码不能为空") String code,
    @NotBlank(message = "用户名不能为空") @Size(min = 3, max = 50, message = "用户名长度需在3到50之间")
        String username,
    @NotBlank(message = "密码不能为空") @Size(min = 6, message = "密码长度至少为6位") String password,
    String avatar,
    @NotBlank(message = "手机号不能为空") String phone) {}
