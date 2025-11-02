/**
 * 背景：
 *  - DTO 层原本按单一目录存放，身份认证模型与其他领域混杂难以检索。
 * 目的：
 *  - 聚合用户名/密码登录请求载荷，集中在 auth 子包中便于识别身份认证上下文。
 * 关键决策与取舍：
 *  - 采用“身份认证”语义子包而非继续扁平结构，以支持未来扩展多因素验证 DTO。
 * 影响范围：
 *  - UserController、UserService 等登录流程的调用方需更新导入路径。
 * 演进与TODO：
 *  - 后续若新增登录渠道，可在本包内扩展专用请求对象并保持接口稳定。
 */
package com.glancy.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Parameters provided when a user attempts to log in.
 */
@Data
public class LoginRequest {

    /**
     * Account string entered by the user. May be a username, email or phone number.
     */
    private String account;

    @NotBlank(message = "{validation.login.password.notblank}")
    private String password;

    // Optional device information used during login
    private String deviceInfo;
}
