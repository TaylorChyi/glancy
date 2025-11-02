package com.glancy.backend.service.user;

import com.glancy.backend.dto.EmailRegistrationRequest;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.EmailVerificationService;
import com.glancy.backend.service.UserProfileService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - 用户注册与账号初始化逻辑长期堆叠在 UserService 中，导致职责臃肿且难以复用。
 * 目的：
 *  - 以命令处理器（Command Handler）收敛注册相关流程，便于拓展更多入驻渠道。
 * 关键决策与取舍：
 *  - 采用组合而非继承，避免与其它命令处理器耦合；
 *  - 在内部保留密码加密器实例，未来可通过依赖注入替换实现。
 * 影响范围：
 *  - 注册、邮箱验证码注册流程委托至此，实现 UserService 解耦。
 * 演进与TODO：
 *  - 后续可引入策略模式承载不同注册渠道（邮箱、手机号、邀请制等）。
 */
@Component
public class UserRegistrationCommand {

    private final UserRepository userRepository;
    private final UserProfileService userProfileService;
    private final EmailVerificationService emailVerificationService;
    private final UserDataSanitizer dataSanitizer;
    private final UserResponseAssembler responseAssembler;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserRegistrationCommand(
        UserRepository userRepository,
        UserProfileService userProfileService,
        EmailVerificationService emailVerificationService,
        UserDataSanitizer dataSanitizer,
        UserResponseAssembler responseAssembler
    ) {
        this.userRepository = userRepository;
        this.userProfileService = userProfileService;
        this.emailVerificationService = emailVerificationService;
        this.dataSanitizer = dataSanitizer;
        this.responseAssembler = responseAssembler;
    }

    /**
     * 意图：处理常规注册请求。
     */
    public UserResponse register(UserRegistrationRequest request) {
        return createUser(
            request.getUsername(),
            request.getPassword(),
            request.getEmail(),
            request.getAvatar(),
            request.getPhone()
        );
    }

    /**
     * 意图：在完成邮箱验证码校验后创建账号。
     */
    public UserResponse registerWithVerification(EmailRegistrationRequest request) {
        emailVerificationService.consumeCode(request.email(), request.code(), EmailVerificationPurpose.REGISTER);
        return createUser(request.username(), request.password(), request.email(), request.avatar(), request.phone());
    }

    private UserResponse createUser(String username, String rawPassword, String email, String avatar, String phone) {
        validateUniqueness(username, email, phone);
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEmail(dataSanitizer.normalizeEmail(email));
        user.setAvatar(dataSanitizer.normalizeAvatar(avatar));
        user.setPhone(phone);
        User saved = userRepository.save(user);
        userProfileService.initProfile(saved.getId());
        return responseAssembler.toUserResponse(saved);
    }

    private void validateUniqueness(String username, String email, String phone) {
        userRepository
            .findByUsernameAndDeletedFalse(username)
            .ifPresent(existing -> {
                throw new DuplicateResourceException("用户名已存在");
            });
        String normalizedEmail = dataSanitizer.normalizeEmail(email);
        userRepository
            .findByEmailAndDeletedFalse(normalizedEmail)
            .ifPresent(existing -> {
                throw new DuplicateResourceException("邮箱已被使用");
            });
        if (phone != null) {
            userRepository
                .findByPhoneAndDeletedFalse(phone)
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("手机号已被使用");
                });
        }
    }
}
