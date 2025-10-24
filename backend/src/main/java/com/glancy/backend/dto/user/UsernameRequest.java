/**
 * 背景：
 *  - 用户名更新请求之前位于扁平 DTO 目录，资料维护链路缺乏聚合。
 * 目的：
 *  - 在 user 包承载用户名变更请求，明确资料领域责任。
 * 关键决策与取舍：
 *  - 继续依赖 Lombok 简化访问器，验证逻辑仍位于服务层。
 * 影响范围：
 *  - 用户名更新接口导入路径迁移至 user 子包。
 * 演进与TODO：
 *  - 若后续支持批量校验，可在本包新增批处理 DTO。
 */
package com.glancy.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body used when updating a user's username.
 */
@Data
public class UsernameRequest {

    @NotBlank(message = "用户名不能为空")
    private String username;
}
