package com.glancy.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Core user entity storing login credentials and profile info. */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Column(unique = true, length = 100)
    private String email;

    // Optional avatar image URL
    private String avatar;

    // Phone number
    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Setter(AccessLevel.NONE)
    @Column(nullable = false)
    private Boolean member = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MembershipType membershipType = MembershipType.NONE;

    private LocalDateTime membershipExpiresAt;

    private LocalDateTime lastLoginAt;

    @JsonIgnore
    private String loginToken;

    /** 判断给定时间点用户会员是否有效，统一落地到布尔标识以兼容既有查询逻辑。 */
    public boolean hasActiveMembershipAt(LocalDateTime evaluationTime) {
        if (membershipType == null || membershipType == MembershipType.NONE) {
            return false;
        }
        if (evaluationTime == null) {
            throw new IllegalArgumentException("evaluationTime must not be null");
        }
        if (membershipExpiresAt == null) {
            return true;
        }
        return membershipExpiresAt.isAfter(evaluationTime);
    }

    /** 使用统一入口更新会员信息，确保布尔字段与等级/有效期保持一致。 */
    public void updateMembership(MembershipType newType, LocalDateTime expiresAt, LocalDateTime evaluationTime) {
        if (evaluationTime == null) {
            throw new IllegalArgumentException("evaluationTime must not be null");
        }
        MembershipType resolvedType = newType == null ? MembershipType.NONE : newType;
        this.membershipType = resolvedType;
        this.membershipExpiresAt = expiresAt;
        synchronizeMembershipStatus(evaluationTime);
    }

    /** 将布尔会员标记刷新为当前等级与有效期计算后的结果，供遗留字段消费。 */
    public void synchronizeMembershipStatus(LocalDateTime evaluationTime) {
        this.member = hasActiveMembershipAt(evaluationTime) ? Boolean.TRUE : Boolean.FALSE;
    }
}
