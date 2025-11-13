package com.glancy.backend.dto;

import com.glancy.backend.entity.MembershipType;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

/** Basic user information returned by many endpoints. */
@Data
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String avatar;
    private String phone;
    private Boolean member;

    /** 当前会员等级，非会员返回 {@code NONE}。 */
    private MembershipType membershipType;

    /** 会员有效期，UTC 时间；无期限会员返回 {@code null}。 */
    private LocalDateTime membershipExpiresAt;
}
