package com.glancy.backend.service.user;

import com.glancy.backend.dto.EmailVerificationCodeRequest;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.EmailVerificationLogContext;
import com.glancy.backend.service.EmailVerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class UserVerificationCommand {

    private static final Logger log = LoggerFactory.getLogger(UserVerificationCommand.class);

    private final UserRepository userRepository;
    private final EmailVerificationService emailVerificationService;
    private final UserDataSanitizer dataSanitizer;

    public UserVerificationCommand(
            UserRepository userRepository,
            EmailVerificationService emailVerificationService,
            UserDataSanitizer dataSanitizer) {
        this.userRepository = userRepository;
        this.emailVerificationService = emailVerificationService;
        this.dataSanitizer = dataSanitizer;
    }

    /** 意图：根据用途发送验证码，并执行必要的前置校验。 */
    public void sendVerificationCode(EmailVerificationCodeRequest request, String clientIp) {
        String normalizedEmail = dataSanitizer.normalizeEmail(request.email());
        EmailVerificationPurpose purpose = request.purpose();
        try (EmailVerificationLogContext ignored = EmailVerificationLogContext.create(normalizedEmail, purpose)) {
            log.info("Email verification issuance flow started");
            switch (purpose) {
                case REGISTER -> ensureEmailNotRegistered(normalizedEmail);
                case LOGIN -> ensureEmailExists(normalizedEmail);
                case CHANGE_EMAIL -> ensureEmailAvailable(normalizedEmail);
                default -> log.info("Processing email verification for custom purpose {}", purpose);
            }
            emailVerificationService.issueCode(normalizedEmail, purpose, clientIp);
            log.info("Email verification issuance flow completed");
        }
    }

    private void ensureEmailNotRegistered(String normalizedEmail) {
        log.info("Validating registration eligibility for email {}", normalizedEmail);
        userRepository.findByEmailAndDeletedFalse(normalizedEmail).ifPresent(existing -> {
            log.warn("Attempt to request registration code for already registered email {}", normalizedEmail);
            throw new DuplicateResourceException("邮箱已被使用");
        });
    }

    private void ensureEmailExists(String normalizedEmail) {
        log.info("Validating login eligibility for email {}", normalizedEmail);
        userRepository.findByEmailAndDeletedFalse(normalizedEmail).orElseThrow(() -> {
            log.warn("Login verification code requested for non-existent email {}", normalizedEmail);
            return new ResourceNotFoundException("用户不存在或已注销");
        });
    }

    private void ensureEmailAvailable(String normalizedEmail) {
        log.info("Validating email change eligibility for email {}", normalizedEmail);
        userRepository.findByEmailAndDeletedFalse(normalizedEmail).ifPresent(existing -> {
            log.warn("Attempt to request change-email code for already bound address {}", normalizedEmail);
            throw new DuplicateResourceException("邮箱已被使用");
        });
    }
}
