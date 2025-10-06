package com.glancy.backend.repository;

import com.glancy.backend.entity.redemption.UserDiscountBenefit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 背景：
 *  - 折扣权益需要持久化保存供下游读取。
 * 目的：
 *  - 提供基础 CRUD 与查询能力。
 * 关键决策与取舍：
 *  - 当前仅保留最小接口，后续根据消费场景扩展查询方法。
 * 影响范围：
 *  - 兑换折扣策略创建记录时使用。
 * 演进与TODO：
 *  - 可根据订单需求增加按有效期过滤等查询。
 */
@Repository
public interface UserDiscountBenefitRepository extends JpaRepository<UserDiscountBenefit, Long> {}
