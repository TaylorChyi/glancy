/**
 * 背景：
 *  - 用户注册请求曾与其他 DTO 并列，注册流程边界模糊。
 * 目的：
 *  - 在 auth 包集中管理账号创建输入模型，方便统一校验策略与扩展点。
 * 关键决策与取舍：
 *  - 保持 Lombok 简化样板代码，并通过包结构而非继承区分注册场景。
 * 影响范围：
 *  - 注册接口相关调用方导入路径需调整。
 * 演进与TODO：
 *  - 若引入分步注册，可在此包新增分阶段 DTO 与上下文标识。
 */
package com.glancy.backend.dto.auth;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Payload for creating a new user account.
 */
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
