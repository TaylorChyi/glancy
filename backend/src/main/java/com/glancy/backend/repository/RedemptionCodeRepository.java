package com.glancy.backend.repository;

import com.glancy.backend.entity.redemption.RedemptionCode;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


@Repository
public interface RedemptionCodeRepository extends JpaRepository<RedemptionCode, Long> {
    // 兼容早期直接插入数据库的兑换码大小写不规范问题，通过 UPPER 保证查询一致性。
    @Query("SELECT c FROM RedemptionCode c WHERE c.deleted = false AND UPPER(c.code) = UPPER(:code)")
    Optional<RedemptionCode> findByCodeAndDeletedFalse(@Param("code") String code);
}
