package com.glancy.backend.service.user;

import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.dto.LoginResponse;
import com.glancy.backend.dto.UserDetailResponse;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.User;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;


@Component
public class UserResponseAssembler {

    private final UserDataSanitizer dataSanitizer;
    private final Clock clock;

    public UserResponseAssembler(UserDataSanitizer dataSanitizer, Clock clock) {
        this.dataSanitizer = dataSanitizer;
        this.clock = clock;
    }

    /**
     * 意图：构造面向通用消费场景的用户响应对象。
     * 输入：User 聚合根。
     * 输出：UserResponse DTO。
     * 流程：获取当前时间 -> 评估会员状态 -> 归一化头像。
     */
    public UserResponse toUserResponse(User user) {
        LocalDateTime now = LocalDateTime.now(clock);
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            dataSanitizer.resolveOutboundAvatar(user.getAvatar()),
            user.getPhone(),
            user.hasActiveMembershipAt(now),
            user.getMembershipType(),
            user.getMembershipExpiresAt()
        );
    }

    /**
     * 意图：构造面向用户详情页的响应对象，附带更多审计属性。
     * 输入：User 聚合根。
     * 输出：UserDetailResponse DTO。
     */
    public UserDetailResponse toUserDetail(User user) {
        LocalDateTime now = LocalDateTime.now(clock);
        return new UserDetailResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            dataSanitizer.resolveOutboundAvatar(user.getAvatar()),
            user.getPhone(),
            user.hasActiveMembershipAt(now),
            user.getMembershipType(),
            user.getMembershipExpiresAt(),
            user.getDeleted(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
            user.getLastLoginAt()
        );
    }

    /**
     * 意图：生成登录响应，包含新的登录令牌。
     * 输入：User 聚合根与登录令牌。
     * 输出：LoginResponse DTO。
     */
    public LoginResponse toLoginResponse(User user, String token) {
        LocalDateTime now = LocalDateTime.now(clock);
        return new LoginResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            dataSanitizer.resolveOutboundAvatar(user.getAvatar()),
            user.getPhone(),
            user.hasActiveMembershipAt(now),
            user.getMembershipType(),
            user.getMembershipExpiresAt(),
            token
        );
    }

    /**
     * 意图：根据存储中的头像引用生成响应对象。
     */
    public AvatarResponse toAvatarResponse(String avatarReference) {
        return new AvatarResponse(dataSanitizer.resolveOutboundAvatar(avatarReference));
    }
}
