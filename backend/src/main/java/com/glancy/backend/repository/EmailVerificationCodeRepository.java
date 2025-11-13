package com.glancy.backend.repository;

import com.glancy.backend.entity.EmailVerificationCode;
import com.glancy.backend.entity.EmailVerificationPurpose;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** Repository for persisting issued email verification codes. */
@Repository
public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {
    Optional<EmailVerificationCode> findTopByEmailAndPurposeAndCodeAndDeletedFalseOrderByCreatedAtDesc(
            String email, EmailVerificationPurpose purpose, String code);

    List<EmailVerificationCode> findByEmailAndPurposeAndUsedFalseAndDeletedFalse(
            String email, EmailVerificationPurpose purpose);

    @Modifying
    @Query("update EmailVerificationCode c set c.used = true "
            + "where c.email = :email and c.purpose = :purpose "
            + "and c.used = false and c.deleted = false and c.expiresAt < :now")
    int markExpiredAsUsed(
            @Param("email") String email,
            @Param("purpose") EmailVerificationPurpose purpose,
            @Param("now") LocalDateTime now);
}
