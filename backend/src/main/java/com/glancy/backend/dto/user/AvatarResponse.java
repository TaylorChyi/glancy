/**
 * 背景：
 *  - 头像返回模型长期放在扁平 DTO 目录，资料领域与认证领域混杂。
 * 目的：
 *  - 在 user 包集中呈现资料相关响应，便于快速辨识用户界面所需数据。
 * 关键决策与取舍：
 *  - 继续保持简单数据载体结构，复杂处理交由服务层避免 DTO 臃肿。
 * 影响范围：
 *  - 头像查询/更新接口导入路径迁移至 user 子包。
 * 演进与TODO：
 *  - 未来若携带裁剪元数据，可在本包追加字段保持内聚。
 */
package com.glancy.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Returned when querying or updating a user's avatar.
 */
@Data
@AllArgsConstructor
public class AvatarResponse {

    private String avatar;
}
