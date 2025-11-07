package com.glancy.backend.service.user;

import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class UserContactPolicy {

    private static final Logger log = LoggerFactory.getLogger(UserContactPolicy.class);

    private final UserRepository userRepository;
    private final UserDataSanitizer dataSanitizer;

    public UserContactPolicy(UserRepository userRepository, UserDataSanitizer dataSanitizer) {
        this.userRepository = userRepository;
        this.dataSanitizer = dataSanitizer;
    }

    /**
     * 意图：在邮箱换绑前完成合法性校验并返回规范化后的邮箱。
     * 输入：用户 id、当前用户实体、新邮箱（允许包含多余空白）。
     * 输出：规范化后的新邮箱。
     */
    public String prepareBindingTargetEmail(Long userId, User user, String email) {
        if (email == null || email.isBlank()) {
            log.warn("User {} attempted to operate email binding with blank target", userId);
            throw new InvalidRequestException("邮箱不能为空");
        }
        String normalizedEmail = dataSanitizer.normalizeEmail(email);
        String currentEmail = user.getEmail();
        if (currentEmail != null && currentEmail.equals(normalizedEmail)) {
            log.warn("User {} attempted to reuse existing email {}", userId, normalizedEmail);
            throw new InvalidRequestException("新邮箱不能与当前邮箱相同");
        }
        userRepository
            .findByEmailAndDeletedFalse(normalizedEmail)
            .ifPresent(existing -> {
                if (!existing.getId().equals(userId)) {
                    log.warn("Email {} already occupied when user {} attempted to bind", normalizedEmail, userId);
                    throw new DuplicateResourceException("邮箱已被使用");
                }
            });
        return normalizedEmail;
    }

    /**
     * 意图：在更新手机号前确保唯一性约束。
     */
    public void assertPhoneAvailable(Long userId, String phone) {
        if (phone == null || phone.isBlank()) {
            return;
        }
        userRepository
            .findByPhoneAndDeletedFalse(phone)
            .ifPresent(existing -> {
                if (!existing.getId().equals(userId)) {
                    log.warn("Phone {} is already in use", phone);
                    throw new DuplicateResourceException("手机号已被使用");
                }
            });
    }
}
