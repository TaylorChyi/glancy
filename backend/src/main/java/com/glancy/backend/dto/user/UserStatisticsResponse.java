/**
 * 背景：
 *  - 用户统计响应曾与多领域 DTO 混杂，运营分析难以及时定位数据出口。
 * 目的：
 *  - 在 user 包集中承载用户维度统计视图，支持后台或报表使用。
 * 关键决策与取舍：
 *  - 维持简单数据载体，统计口径由服务层保障；包划分避免与其他统计混淆。
 * 影响范围：
 *  - 统计接口导入路径更新。
 * 演进与TODO：
 *  - 后续可根据需求引入时间维度或分段统计字段。
 */
package com.glancy.backend.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Aggregated statistics about user accounts.
 */
@Data
@AllArgsConstructor
public class UserStatisticsResponse {

    private long totalUsers;
    private long memberUsers;
    private long deletedUsers;
}
