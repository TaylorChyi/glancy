package com.glancy.backend.repository;

import com.glancy.backend.entity.redemption.RedemptionCode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 背景：
 *  - 兑换码功能需要按照编码检索配置。
 * 目的：
 *  - 提供按编码查询与软删除过滤的仓储接口。
 * 关键决策与取舍：
 *  - 仅暴露必要查询，复杂检索交由服务层组合；
 *  - 使用 Optional 避免返回 null。
 * 影响范围：
 *  - 兑换服务、管理接口依赖。
 * 演进与TODO：
 *  - 后续可扩展分页、模糊搜索能力。
 */
@Repository
public interface RedemptionCodeRepository extends JpaRepository<RedemptionCode, Long> {
    Optional<RedemptionCode> findByCodeAndDeletedFalse(String code);
}
