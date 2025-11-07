package com.glancy.backend.repository;

import com.glancy.backend.entity.redemption.RedemptionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface RedemptionRecordRepository extends JpaRepository<RedemptionRecord, Long> {
    long countByCodeIdAndUserIdAndDeletedFalse(Long codeId, Long userId);
}
