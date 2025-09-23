package com.glancy.backend.dto;

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
    Boolean deleted,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime lastLoginAt
) {
    public static final int CURRENT_VERSION = 1;

    public UserDetailResponse(
        Long id,
        String username,
        String email,
        String avatar,
        String phone,
        Boolean member,
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
            deleted,
            createdAt,
            updatedAt,
            lastLoginAt
        );
    }
}
