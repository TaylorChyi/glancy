/**
 * 背景：
 *  - 联系信息响应之前混在扁平 DTO 目录，无法快速定位资料更新输出。
 * 目的：
 *  - 在 user 包集中管理账户资料返回体，维持领域内聚。
 * 关键决策与取舍：
 *  - 使用 record 保持不可变响应，业务逻辑继续由服务层承担。
 * 影响范围：
 *  - 联系信息查询接口导入路径更新。
 * 演进与TODO：
 *  - 若后续支持多联系方式，可返回集合或附带主联系方式标识。
 */
package com.glancy.backend.dto.user;

/**
 * 返回用户最新的联系方式。
 */
public record UserContactResponse(/** 已更新的用户邮箱。 */ String email, /** 已更新的用户手机号。 */ String phone) {}
