/**
 * 背景：
 *  - 用户详情响应曾置于扁平 DTO 目录，运维排查与资料模型难以区分领域。
 * 目的：
 *  - 在 user 包集中提供带审计信息的用户详情快照，方便资料/治理接口复用。
 * 关键决策与取舍：
 *  - 保留版本字段支持演进，通过包划分明确资料域边界。
 * 影响范围：
 *  - 管理端用户详情查询导入路径更新。
 * 演进与TODO：
 *  - TODO: 若后续增加安全事件或多租户字段，可提升版本并继续在本包内维护。
 */
package com.glancy.backend.dto.user;

import com.glancy.backend.entity.MembershipType;
import java.time.LocalDateTime;

/**
 * Snapshot of a user entity enriched with audit metadata for administrative views.
 *
 * @param version        schema version of this response payload.
 * @param id             unique identifier of the user.
 * @param username       login name displayed to end users.
 * @param email          primary email address bound to the account.
 * @param avatar         externally accessible avatar URL.
 * @param phone          contact phone number in E.164 format.
 * @param member         whether the user holds an active membership.
 * @param membershipType current membership tier.
 * @param membershipExpiresAt expiration timestamp of the current membership.
 * @param deleted        logical deletion marker.
 * @param createdAt      creation timestamp in UTC.
 * @param updatedAt      last update timestamp in UTC.
 * @param lastLoginAt    timestamp of the most recent successful login in UTC.
 */
public record UserDetailResponse(
    int version,
    Long id,
    String username,
    String email,
    String avatar,
    String phone,
    Boolean member,
    MembershipType membershipType,
    LocalDateTime membershipExpiresAt,
    Boolean deleted,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime lastLoginAt
) {
    public static final int CURRENT_VERSION = 2;

    public UserDetailResponse(
        Long id,
        String username,
        String email,
        String avatar,
        String phone,
        Boolean member,
        MembershipType membershipType,
        LocalDateTime membershipExpiresAt,
        Boolean deleted,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime lastLoginAt
    ) {
        this(
            CURRENT_VERSION,
            id,
            username,
            email,
            avatar,
            phone,
            member,
            membershipType,
            membershipExpiresAt,
            deleted,
            createdAt,
            updatedAt,
            lastLoginAt
        );
    }
}
