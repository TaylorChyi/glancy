package com.glancy.backend.service;

import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.dto.EmailLoginRequest;
import com.glancy.backend.dto.EmailRegistrationRequest;
import com.glancy.backend.dto.EmailVerificationCodeRequest;
import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.LoginResponse;
import com.glancy.backend.dto.ThirdPartyAccountRequest;
import com.glancy.backend.dto.ThirdPartyAccountResponse;
import com.glancy.backend.dto.UserContactResponse;
import com.glancy.backend.dto.UserDetailResponse;
import com.glancy.backend.dto.UserEmailResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.dto.UserStatisticsResponse;
import com.glancy.backend.dto.UsernameResponse;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.service.user.UserAuthenticationCommand;
import com.glancy.backend.service.user.UserAvatarCommand;
import com.glancy.backend.service.user.UserContactCommand;
import com.glancy.backend.service.user.UserMembershipCommand;
import com.glancy.backend.service.user.UserProfileCommand;
import com.glancy.backend.service.user.UserProfileQuery;
import com.glancy.backend.service.user.UserRegistrationCommand;
import com.glancy.backend.service.user.UserSocialAccountCommand;
import com.glancy.backend.service.user.UserStatisticsQuery;
import com.glancy.backend.service.user.UserVerificationCommand;
import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


@Slf4j
@Service
public class UserService {

    private final UserProfileQuery profileQuery;
    private final UserProfileCommand profileCommand;
    private final UserRegistrationCommand registrationCommand;
    private final UserVerificationCommand verificationCommand;
    private final UserAuthenticationCommand authenticationCommand;
    private final UserContactCommand contactCommand;
    private final UserAvatarCommand avatarCommand;
    private final UserSocialAccountCommand socialAccountCommand;
    private final UserStatisticsQuery statisticsQuery;
    private final UserMembershipCommand membershipCommand;

    public UserService(
        UserProfileQuery profileQuery,
        UserProfileCommand profileCommand,
        UserRegistrationCommand registrationCommand,
        UserVerificationCommand verificationCommand,
        UserAuthenticationCommand authenticationCommand,
        UserContactCommand contactCommand,
        UserAvatarCommand avatarCommand,
        UserSocialAccountCommand socialAccountCommand,
        UserStatisticsQuery statisticsQuery,
        UserMembershipCommand membershipCommand
    ) {
        this.profileQuery = profileQuery;
        this.profileCommand = profileCommand;
        this.registrationCommand = registrationCommand;
        this.verificationCommand = verificationCommand;
        this.authenticationCommand = authenticationCommand;
        this.contactCommand = contactCommand;
        this.avatarCommand = avatarCommand;
        this.socialAccountCommand = socialAccountCommand;
        this.statisticsQuery = statisticsQuery;
        this.membershipCommand = membershipCommand;
    }

    /** 意图：注册新用户。 */
    @Transactional
    public UserResponse register(UserRegistrationRequest request) {
        log.info("Registering user {}", request.getUsername());
        return registrationCommand.register(request);
    }

    /** 意图：逻辑删除用户。 */
    @Transactional
    public void deleteUser(Long id) {
        profileCommand.deleteUser(id);
    }

    /** 意图：查询原始用户实体。 */
    @Transactional(readOnly = true)
    public User getUserRaw(Long id) {
        return profileQuery.getUserRaw(id);
    }

    /** 意图：查询用户详情。 */
    @Transactional(readOnly = true)
    public UserDetailResponse getUserDetail(Long id) {
        return profileQuery.getUserDetail(id);
    }

    /** 意图：发送邮箱验证码。 */
    @Transactional
    public void sendVerificationCode(EmailVerificationCodeRequest request, String clientIp) {
        verificationCommand.sendVerificationCode(request, clientIp);
    }

    /** 意图：通过邮箱验证码注册用户。 */
    @Transactional
    public UserResponse registerWithEmailVerification(EmailRegistrationRequest request) {
        log.info("Registering user {} via email verification", request.username());
        return registrationCommand.registerWithVerification(request);
    }

    /** 意图：使用邮箱验证码登录。 */
    @Transactional
    public LoginResponse loginWithEmailCode(EmailLoginRequest request) {
        return authenticationCommand.loginWithEmailCode(request);
    }

    /** 意图：使用账号与密码登录。 */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        return authenticationCommand.login(request);
    }

    /** 意图：绑定第三方账号。 */
    @Transactional
    public ThirdPartyAccountResponse bindThirdPartyAccount(Long userId, ThirdPartyAccountRequest request) {
        return socialAccountCommand.bindThirdPartyAccount(userId, request);
    }

    /** 意图：获取用户统计数据。 */
    @Transactional(readOnly = true)
    public UserStatisticsResponse getStatistics() {
        return statisticsQuery.getStatistics();
    }

    /** 意图：统计活跃用户数量。 */
    @Transactional(readOnly = true)
    public long countActiveUsers() {
        return statisticsQuery.countActiveUsers();
    }

    /** 意图：根据令牌获取用户 id。 */
    @Transactional(readOnly = true)
    public Long authenticateToken(String token) {
        return authenticationCommand.authenticateToken(token);
    }

    /** 意图：校验令牌。 */
    @Transactional(readOnly = true)
    public void validateToken(Long userId, String token) {
        authenticationCommand.validateToken(userId, token);
    }

    /** 意图：注销登录。 */
    @Transactional
    public void logout(Long userId, String token) {
        authenticationCommand.logout(userId, token);
    }

    /** 意图：获取用户头像。 */
    @Transactional(readOnly = true)
    public AvatarResponse getAvatar(Long userId) {
        return avatarCommand.getAvatar(userId);
    }

    /** 意图：更新头像引用。 */
    @Transactional
    public AvatarResponse updateAvatar(Long userId, String avatar) {
        return avatarCommand.updateAvatar(userId, avatar);
    }

    /** 意图：上传新头像。 */
    @Transactional
    public AvatarResponse uploadAvatar(Long userId, MultipartFile file) {
        return avatarCommand.uploadAvatar(userId, file);
    }

    /** 意图：更新用户名。 */
    @Transactional
    public UsernameResponse updateUsername(Long userId, String username) {
        return profileCommand.updateUsername(userId, username);
    }

    /** 意图：更新联系方式。 */
    @Transactional
    public UserContactResponse updateContact(Long userId, String email, String phone) {
        return contactCommand.updateContact(userId, email, phone);
    }

    /** 意图：发送邮箱换绑验证码。 */
    @Transactional
    public void requestEmailChangeCode(Long userId, String email, String clientIp) {
        contactCommand.requestEmailChangeCode(userId, email, clientIp);
    }

    /** 意图：换绑邮箱。 */
    @Transactional
    public UserEmailResponse changeEmail(Long userId, String email, String code) {
        return contactCommand.changeEmail(userId, email, code);
    }

    /** 意图：解绑邮箱。 */
    @Transactional
    public UserEmailResponse unbindEmail(Long userId) {
        return contactCommand.unbindEmail(userId);
    }

    /** 意图：激活会员。 */
    @Transactional
    public void activateMembership(Long userId, MembershipType membershipType, LocalDateTime expiresAt) {
        membershipCommand.activateMembership(userId, membershipType, expiresAt);
    }

    /** 意图：移除会员资格。 */
    @Transactional
    public void removeMembership(Long userId) {
        membershipCommand.removeMembership(userId);
    }
}
