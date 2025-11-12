package com.glancy.backend.dto;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.glancy.backend.entity.MembershipType;
import java.time.LocalDateTime;

/** Snapshot of a user entity enriched with audit metadata for administrative views. */
public record UserDetailResponse(
    int version,
    @JsonUnwrapped Identity identity,
    @JsonUnwrapped Membership membership,
    @JsonUnwrapped Audit audit) {
  public static final int CURRENT_VERSION = 2;

  public static UserDetailResponse of(Identity identity, Membership membership, Audit audit) {
    return new UserDetailResponse(CURRENT_VERSION, identity, membership, audit);
  }

  public record Identity(Long id, String username, String email, String avatar, String phone) {}

  public record Membership(
      Boolean member, MembershipType membershipType, LocalDateTime membershipExpiresAt) {}

  public record Audit(
      Boolean deleted,
      LocalDateTime createdAt,
      LocalDateTime updatedAt,
      LocalDateTime lastLoginAt) {}
}
