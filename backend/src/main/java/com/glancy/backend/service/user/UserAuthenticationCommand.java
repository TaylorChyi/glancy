package com.glancy.backend.service.user;

import com.glancy.backend.dto.EmailLoginRequest;
import com.glancy.backend.dto.LoginIdentifier;
import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.LoginResponse;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.entity.LoginDevice;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.LoginDeviceRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.EmailVerificationService;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserAuthenticationCommand {

    private static final Logger log = LoggerFactory.getLogger(UserAuthenticationCommand.class);

    private final UserRepository userRepository;
    private final LoginDeviceRepository loginDeviceRepository;
    private final EmailVerificationService emailVerificationService;
    private final UserResponseAssembler responseAssembler;
    private final UserDataSanitizer dataSanitizer;
    private final Clock clock;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserAuthenticationCommand(
        UserRepository userRepository,
        LoginDeviceRepository loginDeviceRepository,
        EmailVerificationService emailVerificationService,
        UserResponseAssembler responseAssembler,
        UserDataSanitizer dataSanitizer,
        Clock clock
    ) {
        this.userRepository = userRepository;
        this.loginDeviceRepository = loginDeviceRepository;
        this.emailVerificationService = emailVerificationService;
        this.responseAssembler = responseAssembler;
        this.dataSanitizer = dataSanitizer;
        this.clock = clock;
    }

    /**
     * 意图：使用邮箱验证码登录。
     */
    public LoginResponse loginWithEmailCode(EmailLoginRequest request) {
        String normalizedEmail = dataSanitizer.normalizeEmail(request.email());
        emailVerificationService.consumeCode(normalizedEmail, request.code(), EmailVerificationPurpose.LOGIN);
        User user = userRepository
            .findByEmailAndDeletedFalse(normalizedEmail)
            .orElseThrow(() -> new ResourceNotFoundException("用户不存在或已注销"));
        log.info("Logging in user {} via email code", user.getId());
        return completeLogin(user, request.deviceInfo());
    }

    /**
     * 意图：使用账号（用户名/邮箱/手机号）与密码登录。
     */
    public LoginResponse login(LoginRequest request) {
        String account = request.getAccount();
        if (account == null || account.isEmpty()) {
            log.warn("No account provided for login");
            throw new InvalidRequestException("用户名、邮箱或手机号必须填写其一");
        }
        LoginIdentifier.Type type = LoginIdentifier.resolveType(account);
        User user = resolveUser(type, account);
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Password mismatch for user {}", user.getUsername());
            throw new InvalidRequestException("密码错误");
        }
        return completeLogin(user, request.getDeviceInfo());
    }

    /**
     * 意图：根据登录令牌查找用户。
     */
    public Long authenticateToken(String token) {
        return userRepository
            .findByLoginToken(token)
            .map(User::getId)
            .orElseThrow(() -> new InvalidRequestException("无效的用户令牌"));
    }

    /**
     * 意图：校验令牌与用户是否匹配。
     */
    public void validateToken(Long userId, String token) {
        userRepository
            .findById(userId)
            .filter(user -> token != null && token.equals(user.getLoginToken()))
            .orElseThrow(() -> new InvalidRequestException("无效的用户令牌"));
    }

    /**
     * 意图：注销用户登录令牌。
     */
    public void logout(Long userId, String token) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        if (token == null || !token.equals(user.getLoginToken())) {
            throw new InvalidRequestException("无效的用户令牌");
        }
        user.setLoginToken(null);
        userRepository.save(user);
    }

    private User resolveUser(LoginIdentifier.Type type, String account) {
        return switch (type) {
            case EMAIL -> resolveByEmail(account);
            case PHONE -> resolveByPhone(account);
            case USERNAME -> resolveByUsername(account);
            default -> resolveByUsername(account);
        };
    }

    private User resolveByEmail(String email) {
        String normalizedEmail = dataSanitizer.normalizeEmail(email);
        return userRepository
            .findByEmailAndDeletedFalse(normalizedEmail)
            .orElseThrow(() -> {
                log.warn("User with email {} not found or deleted", normalizedEmail);
                return new ResourceNotFoundException("用户不存在或已注销");
            });
    }

    private User resolveByPhone(String phone) {
        String normalized = phone;
        if (!normalized.startsWith("+")) {
            normalized = "+86" + normalized;
        }
        String lookup = normalized;
        String raw = phone;
        return userRepository
            .findByPhoneAndDeletedFalse(lookup)
            .orElseGet(() ->
                userRepository
                    .findByPhoneAndDeletedFalse(raw)
                    .orElseThrow(() -> {
                        log.warn("User with phone {} not found or deleted", raw);
                        return new ResourceNotFoundException("用户不存在或已注销");
                    })
            );
    }

    private User resolveByUsername(String username) {
        return userRepository
            .findByUsernameAndDeletedFalse(username)
            .orElseThrow(() -> {
                log.warn("User {} not found or deleted", username);
                return new ResourceNotFoundException("用户不存在或已注销");
            });
    }

    private LoginResponse completeLogin(User user, String deviceInfo) {
        if (deviceInfo != null && !deviceInfo.isEmpty()) {
            LoginDevice device = new LoginDevice();
            device.setUser(user);
            device.setDeviceInfo(deviceInfo);
            loginDeviceRepository.save(device);
            List<LoginDevice> devices = loginDeviceRepository.findByUserIdOrderByLoginTimeAsc(user.getId());
            if (devices.size() > 3) {
                for (int i = 0; i < devices.size() - 3; i++) {
                    loginDeviceRepository.delete(devices.get(i));
                }
            }
        }
        LocalDateTime now = LocalDateTime.now(clock);
        user.setLastLoginAt(now);
        user.synchronizeMembershipStatus(now);
        String token = UUID.randomUUID().toString();
        user.setLoginToken(token);
        userRepository.save(user);
        log.info("User {} logged in", user.getId());
        return responseAssembler.toLoginResponse(user, token);
    }
}
