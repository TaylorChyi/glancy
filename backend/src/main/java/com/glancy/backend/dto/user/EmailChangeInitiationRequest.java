/**
 * 背景：
 *  - 邮箱换绑流程的数据模型原本与登录注册 DTO 混排，降低演进效率。
 * 目的：
 *  - 将账号资料维护请求归档至 user 包，突出账户资料管理的职责。
 * 关键决策与取舍：
 *  - 延续 record 语法保持不可变性，同时通过包划分避免耦合认证链路。
 * 影响范围：
 *  - 邮箱换绑入口的导入路径需更新。
 * 演进与TODO：
 *  - 后续支持多邮箱策略时，可在本包新增验证渠道字段。
 */
package com.glancy.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * 请求向新邮箱发送换绑验证码的载体。
 */
public record EmailChangeInitiationRequest(
    /** 待绑定的新邮箱地址。 */ @NotBlank(message = "邮箱不能为空") @Email(message = "邮箱格式不正确") String email
) {}
