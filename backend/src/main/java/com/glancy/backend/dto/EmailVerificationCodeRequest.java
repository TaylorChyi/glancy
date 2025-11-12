package com.glancy.backend.dto;

import com.glancy.backend.entity.EmailVerificationPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Request payload for triggering a verification code email. */
public record EmailVerificationCodeRequest(
    @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
    @NotNull(message = "验证码用途不能为空") EmailVerificationPurpose purpose) {}
