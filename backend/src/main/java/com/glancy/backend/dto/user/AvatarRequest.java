/**
 * 背景：
 *  - 用户头像更新请求曾与多种 DTO 混合，难以从结构上识别其归属。
 * 目的：
 *  - 将用户资料相关请求集中至 user 包，突出资料管理场景。
 * 关键决策与取舍：
 *  - 继续保持不可变字段约束由 Lombok 生成访问器，业务校验仍由服务承担。
 * 影响范围：
 *  - 用户资料接口导入路径迁移至 user 子包。
 * 演进与TODO：
 *  - 若未来支持多头像源，可在本包引入策略标识字段。
 */
package com.glancy.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body used when updating a user's avatar.
 */
@Data
public class AvatarRequest {

    @NotBlank(message = "头像地址不能为空")
    private String avatar;
}
