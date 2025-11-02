/**
 * 背景：
 *  - 验证码发送请求散落在扁平 DTO 目录，审核邮件流程时难以及时定位模型。
 * 目的：
 *  - 将验证码请求归档到 auth 包，统一管理认证链路中的输入契约。
 * 关键决策与取舍：
 *  - 继续依赖 EmailVerificationPurpose 枚举，以类型安全方式限制用途。
 * 影响范围：
 *  - 发送验证码的控制器与服务导入路径将迁移至 auth 子包。
 * 演进与TODO：
 *  - 后续支持多渠道发送时，可在本包新增对应请求并抽象策略组件。
 */
package com.glancy.backend.dto.auth;

import com.glancy.backend.entity.EmailVerificationPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for triggering a verification code email.
 */
public record EmailVerificationCodeRequest(
    @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email,
    @NotNull(message = "验证码用途不能为空") EmailVerificationPurpose purpose
) {}
