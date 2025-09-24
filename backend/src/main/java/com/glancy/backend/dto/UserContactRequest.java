package com.glancy.backend.dto;

import jakarta.annotation.Nullable;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * 请求更新用户邮箱与手机号的载体。
 */
public record UserContactRequest(
    /** 用户联系邮箱。 */
    @Nullable @Email(message = "邮箱格式不正确") String email,
    /** 用户联系手机号，采用国际区号+号码格式或纯数字。 */
    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^\\+?[0-9]{3,}$", message = "手机号格式不正确")
    String phone
) {}
