package com.glancy.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 请求向新邮箱发送换绑验证码的载体。
 */
public record EmailChangeInitiationRequest(
    /** 待绑定的新邮箱地址。 */ @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email
) {}
