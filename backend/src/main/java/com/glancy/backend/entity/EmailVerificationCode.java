package com.glancy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

/**
 * Verification code issued to confirm ownership of an email address for
 * authentication related flows.
 */
@Entity
@Table(
    name = "email_verification_codes",
    indexes = {
        @Index(name = "idx_email_purpose_active", columnList = "email, purpose, expiresAt"),
        @Index(name = "idx_email_created", columnList = "email, createdAt"),
    }
)
@Getter
@Setter
public class EmailVerificationCode extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 10)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmailVerificationPurpose purpose;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private Boolean used = false;
}
