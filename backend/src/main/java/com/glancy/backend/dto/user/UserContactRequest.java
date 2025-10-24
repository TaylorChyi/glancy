/**
 * 背景：
 *  - 用户联系信息更新 DTO 之前与认证类模型混放，定位困难。
 * 目的：
 *  - 在 user 包聚合账号资料维护输入，保持联系信息修改语义聚焦。
 * 关键决策与取舍：
 *  - 延续 record 不可变性，同时在 DTO 层保持纯字段定义避免业务逻辑。
 * 影响范围：
 *  - 联系信息更新流程导入路径需调整。
 * 演进与TODO：
 *  - 如未来允许多个联系方式，可在本包扩展集合型 DTO。
 */
package com.glancy.backend.dto.user;

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
