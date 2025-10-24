/**
 * 背景：
 *  - 用户邮箱响应长期放在扁平目录，查询资料接口难以聚焦。
 * 目的：
 *  - 将邮箱查询响应纳入 user 包，保持账户资料返回体的聚合。
 * 关键决策与取舍：
 *  - 使用 record 表达不可变值对象，不在 DTO 层嵌入业务判断。
 * 影响范围：
 *  - 邮箱查询接口导入路径调整。
 * 演进与TODO：
 *  - 若需返回邮箱验证状态，可在本包扩展字段。
 */
package com.glancy.backend.dto.user;

/**
 * 返回用户当前绑定邮箱的响应体。
 */
public record UserEmailResponse(/** 用户当前绑定的邮箱，未绑定时为 null。 */ String email) {}
