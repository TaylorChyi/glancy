/**
 * 背景：
 *  - 用户名响应之前与认证输出混放，资料接口难以定位模型。
 * 目的：
 *  - 将用户名响应归档至 user 包，保持资料查询语义内聚。
 * 关键决策与取舍：
 *  - 沿用 Lombok 降低样板代码，DTO 保持纯数据。
 * 影响范围：
 *  - 用户名查询接口导入路径更新。
 * 演进与TODO：
 *  - 如需返回历史用户名或审核状态，可在本包扩展响应类型。
 */
package com.glancy.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Returned when querying or updating a user's username.
 */
@Data
@AllArgsConstructor
public class UsernameResponse {

    private String username;
}
