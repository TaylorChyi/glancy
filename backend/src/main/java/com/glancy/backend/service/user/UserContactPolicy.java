package com.glancy.backend.service.user;

import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - 邮箱换绑与联系方式更新的前置校验散落在不同用例中，存在重复与维护风险。
 * 目的：
 *  - 通过策略对象集中管理联系方式相关约束，便于在多个命令间复用。
 * 关键决策与取舍：
 *  - 采用领域策略（Policy）模式封装规则，保留日志语义；
 *  - 放弃静态工具方法，方便后续通过依赖注入扩展白名单或多租户策略。
 * 影响范围：
 *  - 邮箱换绑、验证码发送与联系方式更新都会调用该策略。
 * 演进与TODO：
 *  - 后续可接入特性开关或多租户配置，自定义唯一性校验与通知策略。
 */
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
