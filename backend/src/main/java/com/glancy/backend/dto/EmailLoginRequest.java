package com.glancy.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Request payload for logging in with an email verification code. */
public record EmailLoginRequest(
        @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
        @NotBlank(message = "验证码不能为空") String code,
        String deviceInfo) {}
