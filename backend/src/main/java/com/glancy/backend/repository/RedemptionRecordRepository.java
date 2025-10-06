package com.glancy.backend.repository;

import com.glancy.backend.entity.redemption.RedemptionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 背景：
 *  - 需要统计用户对同一兑换码的兑换次数。
 * 目的：
 *  - 暴露基于用户与兑换码的计数查询。
 * 关键决策与取舍：
 *  - 依赖 Spring Data 的派生查询自动过滤软删除标志。
 * 影响范围：
 *  - 兑换限流逻辑依赖该接口。
 * 演进与TODO：
 *  - 后续若需要按时间范围统计，可扩展自定义查询。
 */
@Repository
public interface RedemptionRecordRepository extends JpaRepository<RedemptionRecord, Long> {
    long countByCodeIdAndUserIdAndDeletedFalse(Long codeId, Long userId);
}
