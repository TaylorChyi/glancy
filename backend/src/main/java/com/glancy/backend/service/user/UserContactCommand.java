package com.glancy.backend.service.user;

import com.glancy.backend.dto.UserContactResponse;
import com.glancy.backend.dto.UserEmailResponse;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.EmailVerificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class UserContactCommand {

    private static final Logger log = LoggerFactory.getLogger(UserContactCommand.class);

    private final UserRepository userRepository;
    private final EmailVerificationService emailVerificationService;
    private final UserContactPolicy contactPolicy;
    private final UserDataSanitizer dataSanitizer;

    public UserContactCommand(
            UserRepository userRepository,
            EmailVerificationService emailVerificationService,
            UserContactPolicy contactPolicy,
            UserDataSanitizer dataSanitizer) {
        this.userRepository = userRepository;
        this.emailVerificationService = emailVerificationService;
        this.contactPolicy = contactPolicy;
        this.dataSanitizer = dataSanitizer;
    }

    /** 意图：更新用户联系方式，并确保邮箱变更通过专用流程完成。 */
    public UserContactResponse updateContact(Long userId, String email, String phone) {
        log.info("Updating contact information for user {}", userId);
        User user = loadUser(userId);
        if (email != null && !email.isBlank()) {
            String normalizedEmail = dataSanitizer.normalizeEmail(email);
            String currentEmail = user.getEmail();
            if (currentEmail == null || !currentEmail.equals(normalizedEmail)) {
                log.warn("Direct email change attempt detected for user {}", userId);
                throw new InvalidRequestException("请通过邮箱换绑流程完成更新");
            }
        }
        contactPolicy.assertPhoneAvailable(userId, phone);
        if (phone != null && !phone.isBlank()) {
            user.setPhone(phone);
        }
        User saved = userRepository.save(user);
        return new UserContactResponse(saved.getEmail(), saved.getPhone());
    }

    /** 意图：触发邮箱换绑验证码发送。 */
    public void requestEmailChangeCode(Long userId, String email, String clientIp) {
        log.info("Requesting email change code for user {}", userId);
        User user = loadUser(userId);
        String normalizedEmail = contactPolicy.prepareBindingTargetEmail(userId, user, email);
        emailVerificationService.issueCode(normalizedEmail, EmailVerificationPurpose.CHANGE_EMAIL, clientIp);
    }

    /** 意图：在验证码校验通过后完成邮箱换绑。 */
    public UserEmailResponse changeEmail(Long userId, String email, String code) {
        log.info("Changing email for user {}", userId);
        User user = loadUser(userId);
        String normalizedEmail = contactPolicy.prepareBindingTargetEmail(userId, user, email);
        String sanitizedCode = dataSanitizer.sanitizeVerificationCode(code);
        emailVerificationService.consumeCode(normalizedEmail, sanitizedCode, EmailVerificationPurpose.CHANGE_EMAIL);
        user.setEmail(normalizedEmail);
        User saved = userRepository.save(user);
        log.info("Email changed for user {}", userId);
        return new UserEmailResponse(saved.getEmail());
    }

    /** 意图：解绑邮箱并失效残留验证码。 */
    public UserEmailResponse unbindEmail(Long userId) {
        log.info("Unbinding email for user {}", userId);
        User user = loadUser(userId);
        if (user.getEmail() == null) {
            log.info("User {} requested email unbind but no email was associated", userId);
            return new UserEmailResponse(null);
        }
        String currentEmail = user.getEmail();
        emailVerificationService.invalidateCodes(currentEmail, EmailVerificationPurpose.CHANGE_EMAIL);
        user.setEmail(null);
        User saved = userRepository.save(user);
        return new UserEmailResponse(saved.getEmail());
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }
}
