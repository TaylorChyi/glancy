/**
 * 背景：
 *  - 第三方账号绑定请求与其他用户资料 DTO 共处一个目录，导致认证流程语义不清。
 * 目的：
 *  - 将外部账号绑定请求归类至 auth 包，凸显其作为认证适配器输入的角色。
 * 关键决策与取舍：
 *  - 依旧保持简单不可变字段载荷，授权流程扩展交由服务层策略处理。
 * 影响范围：
 *  - 绑定流程相关 controller/service 导入路径迁移至 auth 子包。
 * 演进与TODO：
 *  - 未来若引入 OAuth profile 数据，可在本包新增扩展 DTO 与 provider 策略。
 */
package com.glancy.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Payload for binding an external account to a user.
 */
@Data
public class ThirdPartyAccountRequest {

    @NotBlank(message = "{validation.thirdPartyAccount.provider.notblank}")
    private String provider;

    @NotBlank(message = "{validation.thirdPartyAccount.externalId.notblank}")
    private String externalId;
}
