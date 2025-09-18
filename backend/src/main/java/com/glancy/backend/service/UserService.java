package com.glancy.backend.service;

import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.dto.EmailLoginRequest;
import com.glancy.backend.dto.EmailRegistrationRequest;
import com.glancy.backend.dto.EmailVerificationCodeRequest;
import com.glancy.backend.dto.LoginIdentifier;
import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.LoginResponse;
import com.glancy.backend.dto.ThirdPartyAccountRequest;
import com.glancy.backend.dto.ThirdPartyAccountResponse;
import com.glancy.backend.dto.UserContactResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.dto.UserStatisticsResponse;
import com.glancy.backend.dto.UsernameResponse;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.entity.LoginDevice;
import com.glancy.backend.entity.ThirdPartyAccount;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.LoginDeviceRepository;
import com.glancy.backend.repository.ThirdPartyAccountRepository;
import com.glancy.backend.repository.UserRepository;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Provides core user management operations such as registration,
 * login and third-party account binding.
 */
@Slf4j
@Service
public class UserService {

    private final UserRepository userRepository;
    private final LoginDeviceRepository loginDeviceRepository;
    private final ThirdPartyAccountRepository thirdPartyAccountRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final AvatarStorage avatarStorage;
    private final UserProfileService userProfileService;
    private final EmailVerificationService emailVerificationService;

    public UserService(
        UserRepository userRepository,
        LoginDeviceRepository loginDeviceRepository,
        ThirdPartyAccountRepository thirdPartyAccountRepository,
        AvatarStorage avatarStorage,
        UserProfileService userProfileService,
        EmailVerificationService emailVerificationService
    ) {
        this.userRepository = userRepository;
        this.loginDeviceRepository = loginDeviceRepository;
        this.thirdPartyAccountRepository = thirdPartyAccountRepository;
        this.avatarStorage = avatarStorage;
        this.userProfileService = userProfileService;
        this.emailVerificationService = emailVerificationService;
    }

    /**
     * Register a new user ensuring username and email uniqueness.
     */
    @Transactional
    public UserResponse register(UserRegistrationRequest req) {
        log.info("Registering user {}", req.getUsername());
        return createUser(req.getUsername(), req.getPassword(), req.getEmail(), req.getAvatar(), req.getPhone());
    }

    /**
     * Logically delete a user account.
     */
    @Transactional
    public void deleteUser(Long id) {
        log.info("Deleting user {}", id);
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        user.setDeleted(true);
        userRepository.save(user);
    }

    /**
     * Retrieve a user by id, regardless of deletion flag.
     */
    @Transactional(readOnly = true)
    public User getUserRaw(Long id) {
        log.info("Fetching user {}", id);
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }

    /**
     * Send a verification code to the provided email for the requested purpose.
     */
    @Transactional
    public void sendVerificationCode(EmailVerificationCodeRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        EmailVerificationPurpose purpose = request.purpose();
        try (EmailVerificationLogContext ignored = EmailVerificationLogContext.create(normalizedEmail, purpose)) {
            log.info("Email verification issuance flow started");
            if (purpose == EmailVerificationPurpose.REGISTER) {
                log.info("Validating registration eligibility for email {}", normalizedEmail);
                userRepository
                    .findByEmailAndDeletedFalse(normalizedEmail)
                    .ifPresent(u -> {
                        log.warn(
                            "Attempt to request registration code for already registered email {}",
                            normalizedEmail
                        );
                        throw new DuplicateResourceException("邮箱已被使用");
                    });
            } else if (purpose == EmailVerificationPurpose.LOGIN) {
                log.info("Validating login eligibility for email {}", normalizedEmail);
                userRepository
                    .findByEmailAndDeletedFalse(normalizedEmail)
                    .orElseThrow(() -> {
                        log.warn("Login verification code requested for non-existent email {}", normalizedEmail);
                        return new ResourceNotFoundException("用户不存在或已注销");
                    });
            } else {
                log.info("Processing email verification for custom purpose {}", purpose);
            }
            emailVerificationService.issueCode(normalizedEmail, purpose);
            log.info("Email verification issuance flow completed");
        }
    }

    /**
     * Register a new account after verifying ownership of the email address.
     */
    @Transactional
    public UserResponse registerWithEmailVerification(EmailRegistrationRequest request) {
        log.info("Registering user {} via email verification", request.username());
        emailVerificationService.consumeCode(request.email(), request.code(), EmailVerificationPurpose.REGISTER);
        return createUser(request.username(), request.password(), request.email(), request.avatar(), request.phone());
    }

    /**
     * Authenticate a user with an email verification code.
     */
    @Transactional
    public LoginResponse loginWithEmailCode(EmailLoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        emailVerificationService.consumeCode(normalizedEmail, request.code(), EmailVerificationPurpose.LOGIN);
        User user = userRepository
            .findByEmailAndDeletedFalse(normalizedEmail)
            .orElseThrow(() -> new ResourceNotFoundException("用户不存在或已注销"));
        log.info("Logging in user {} via email code", user.getId());
        return completeLogin(user, request.deviceInfo());
    }

    /**
     * Authenticate a user and record login device information if provided.
     */
    @Transactional
    public LoginResponse login(LoginRequest req) {
        String account = req.getAccount();
        if (account == null || account.isEmpty()) {
            log.warn("No account provided for login");
            throw new InvalidRequestException("用户名、邮箱或手机号必须填写其一");
        }

        LoginIdentifier.Type type = LoginIdentifier.resolveType(account);

        String identifier;
        User user;
        switch (type) {
            case EMAIL:
                identifier = account;
                final String email = identifier;
                user = userRepository
                    .findByEmailAndDeletedFalse(email)
                    .orElseThrow(() -> {
                        log.warn("User with email {} not found or deleted", email);
                        return new ResourceNotFoundException("用户不存在或已注销");
                    });
                break;
            case PHONE:
                identifier = account;
                String phone = identifier;
                if (!phone.startsWith("+")) {
                    phone = "+86" + phone;
                }
                final String lookupPhone = phone;
                final String raw = identifier;
                user = userRepository
                    .findByPhoneAndDeletedFalse(lookupPhone)
                    .orElseGet(() ->
                        userRepository
                            .findByPhoneAndDeletedFalse(raw)
                            .orElseThrow(() -> {
                                log.warn("User with phone {} not found or deleted", raw);
                                return new ResourceNotFoundException("用户不存在或已注销");
                            })
                    );
                identifier = phone;
                break;
            case USERNAME:
            default:
                identifier = account;
                final String uname = identifier;
                user = userRepository
                    .findByUsernameAndDeletedFalse(uname)
                    .orElseThrow(() -> {
                        log.warn("User {} not found or deleted", uname);
                        return new ResourceNotFoundException("用户不存在或已注销");
                    });
                break;
        }

        log.info("Attempting login for {}", identifier);

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            log.warn("Password mismatch for user {}", user.getUsername());
            throw new InvalidRequestException("密码错误");
        }

        return completeLogin(user, req.getDeviceInfo());
    }

    /**
     * Bind an external account (e.g. social login) to an existing user.
     */
    @Transactional
    public ThirdPartyAccountResponse bindThirdPartyAccount(Long userId, ThirdPartyAccountRequest req) {
        log.info("Binding {} account for user {}", req.getProvider(), userId);
        User user = userRepository
            .findById(userId)
            .orElseThrow(() -> {
                log.warn("User with id {} not found", userId);
                return new ResourceNotFoundException("用户不存在");
            });

        thirdPartyAccountRepository
            .findByProviderAndExternalId(req.getProvider(), req.getExternalId())
            .ifPresent(a -> {
                log.warn("Third-party account {}:{} already bound", req.getProvider(), req.getExternalId());
                throw new DuplicateResourceException("该第三方账号已绑定");
            });

        ThirdPartyAccount account = new ThirdPartyAccount();
        account.setUser(user);
        account.setProvider(req.getProvider());
        account.setExternalId(req.getExternalId());
        ThirdPartyAccount saved = thirdPartyAccountRepository.save(account);
        return new ThirdPartyAccountResponse(
            saved.getId(),
            saved.getProvider(),
            saved.getExternalId(),
            saved.getUser().getId()
        );
    }

    /**
     * Gather statistics about all user accounts.
     */
    @Transactional(readOnly = true)
    public UserStatisticsResponse getStatistics() {
        long total = userRepository.count();
        long deleted = userRepository.countByDeletedTrue();
        long members = userRepository.countByDeletedFalseAndMemberTrue();
        return new UserStatisticsResponse(total, members, deleted);
    }

    /**
     * Count all active (non-deleted) users.
     */
    @Transactional(readOnly = true)
    public long countActiveUsers() {
        return userRepository.countByDeletedFalse();
    }

    /**
     * Authenticate a login token and return the associated user ID.
     */
    @Transactional(readOnly = true)
    public Long authenticateToken(String token) {
        return userRepository
            .findByLoginToken(token)
            .map(User::getId)
            .orElseThrow(() -> new InvalidRequestException("无效的用户令牌"));
    }

    @Transactional(readOnly = true)
    public void validateToken(Long userId, String token) {
        userRepository
            .findById(userId)
            .filter(u -> token != null && token.equals(u.getLoginToken()))
            .orElseThrow(() -> new InvalidRequestException("无效的用户令牌"));
    }

    /**
     * Invalidate the login token for a user, effectively logging them out.
     */
    @Transactional
    public void logout(Long userId, String token) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        if (token == null || !token.equals(user.getLoginToken())) {
            throw new InvalidRequestException("无效的用户令牌");
        }
        user.setLoginToken(null);
        userRepository.save(user);
    }

    /**
     * Retrieve only the avatar URL of a user.
     */
    @Transactional(readOnly = true)
    public AvatarResponse getAvatar(Long userId) {
        log.info("Fetching avatar for user {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        return new AvatarResponse(user.getAvatar());
    }

    /**
     * Update the avatar URL for the specified user.
     */
    @Transactional
    public AvatarResponse updateAvatar(Long userId, String avatar) {
        log.info("Updating avatar for user {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        String previousAvatar = user.getAvatar();
        user.setAvatar(avatar);
        User saved = userRepository.save(user);
        log.info("Avatar updated for user {} from {} to {}", userId, previousAvatar, saved.getAvatar());
        return new AvatarResponse(saved.getAvatar());
    }

    /**
     * Upload a new avatar image and update the user's record.
     */
    @Transactional
    public AvatarResponse uploadAvatar(Long userId, MultipartFile file) {
        try {
            String url = avatarStorage.upload(file);
            return updateAvatar(userId, url);
        } catch (IOException e) {
            log.error("Failed to upload avatar", e);
            throw new InvalidRequestException("上传头像失败");
        }
    }

    /**
     * Update the username for the specified user.
     */
    @Transactional
    public UsernameResponse updateUsername(Long userId, String username) {
        log.info("Updating username for user {}", userId);
        userRepository
            .findByUsernameAndDeletedFalse(username)
            .ifPresent(u -> {
                throw new DuplicateResourceException("用户名已存在");
            });
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        user.setUsername(username);
        User saved = userRepository.save(user);
        return new UsernameResponse(saved.getUsername());
    }

    /**
     * Update the email and phone contact information for the specified user.
     */
    @Transactional
    public UserContactResponse updateContact(Long userId, String email, String phone) {
        log.info("Updating contact information for user {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        if (email != null && !email.isBlank()) {
            String normalizedEmail = normalizeEmail(email);
            userRepository
                .findByEmailAndDeletedFalse(normalizedEmail)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(userId)) {
                        log.warn("Email {} is already in use", normalizedEmail);
                        throw new DuplicateResourceException("邮箱已被使用");
                    }
                });
            user.setEmail(normalizedEmail);
        }

        if (phone != null && !phone.isBlank()) {
            userRepository
                .findByPhoneAndDeletedFalse(phone)
                .ifPresent(existing -> {
                    if (!existing.getId().equals(userId)) {
                        log.warn("Phone {} is already in use", phone);
                        throw new DuplicateResourceException("手机号已被使用");
                    }
                });
            user.setPhone(phone);
        }

        User saved = userRepository.save(user);
        return new UserContactResponse(saved.getEmail(), saved.getPhone());
    }

    /**
     * Set a user as member.
     */
    @Transactional
    public void activateMembership(Long userId) {
        log.info("Activating membership for user {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        user.setMember(true);
        userRepository.save(user);
    }

    /**
     * Remove member status from a user.
     */
    @Transactional
    public void removeMembership(Long userId) {
        log.info("Removing membership for user {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        user.setMember(false);
        userRepository.save(user);
    }

    private UserResponse createUser(String username, String rawPassword, String email, String avatar, String phone) {
        userRepository
            .findByUsernameAndDeletedFalse(username)
            .ifPresent(u -> {
                log.warn("Username {} already exists", username);
                throw new DuplicateResourceException("用户名已存在");
            });
        String normalizedEmail = normalizeEmail(email);
        userRepository
            .findByEmailAndDeletedFalse(normalizedEmail)
            .ifPresent(u -> {
                log.warn("Email {} is already in use", normalizedEmail);
                throw new DuplicateResourceException("邮箱已被使用");
            });
        userRepository
            .findByPhoneAndDeletedFalse(phone)
            .ifPresent(u -> {
                log.warn("Phone {} is already in use", phone);
                throw new DuplicateResourceException("手机号已被使用");
            });
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setEmail(normalizedEmail);
        user.setAvatar(avatar);
        user.setPhone(phone);
        User saved = userRepository.save(user);
        userProfileService.initProfile(saved.getId());
        return new UserResponse(
            saved.getId(),
            saved.getUsername(),
            saved.getEmail(),
            saved.getAvatar(),
            saved.getPhone()
        );
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

        user.setLastLoginAt(LocalDateTime.now());
        String token = UUID.randomUUID().toString();
        user.setLoginToken(token);
        userRepository.save(user);

        log.info("User {} logged in", user.getId());
        return new LoginResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getAvatar(),
            user.getPhone(),
            user.getMember(),
            token
        );
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
