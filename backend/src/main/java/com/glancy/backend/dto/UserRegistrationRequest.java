package com.glancy.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Payload for creating a new user account. */
@Data
public class UserRegistrationRequest {

    @NotBlank(message = "{validation.userRegistration.username.notblank}")
    @Size(min = 3, max = 50, message = "用户名长度需在3到50之间")
    private String username;

    @NotBlank(message = "{validation.userRegistration.password.notblank}")
    @Size(min = 6, message = "密码长度至少为6位")
    private String password;

    @NotBlank(message = "{validation.userRegistration.email.notblank}")
    @Email(message = "邮箱格式不正确")
    private String email;

    // Optional avatar URL
    private String avatar;

    @NotBlank(message = "{validation.userRegistration.phone.notblank}")
    private String phone;
}
