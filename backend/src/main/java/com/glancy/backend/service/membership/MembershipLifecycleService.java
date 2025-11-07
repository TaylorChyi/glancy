package com.glancy.backend.service.membership;

import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class MembershipLifecycleService {

    private final UserRepository userRepository;

    public MembershipLifecycleService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * 意图：为用户激活或覆盖会员状态。
     */
    @Transactional
    public MembershipSnapshot activateMembership(
        Long userId,
        MembershipType membershipType,
        LocalDateTime expiresAt,
        LocalDateTime evaluationTime
    ) {
        MembershipType resolvedType = membershipType == null ? MembershipType.PLUS : membershipType;
        log.info("Activating membership for user {} with tier {} until {}", userId, resolvedType, expiresAt);
        User user = loadUser(userId);
        user.updateMembership(resolvedType, expiresAt, evaluationTime);
        return MembershipSnapshot.fromUser(user, evaluationTime);
    }

    /**
     * 意图：在保持乐观锁语义的同时延长会员有效期。
     */
    @Transactional
    public MembershipSnapshot extendMembership(
        Long userId,
        MembershipType membershipType,
        Duration extension,
        LocalDateTime evaluationTime
    ) {
        if (extension == null || extension.isZero() || extension.isNegative()) {
            throw new InvalidRequestException("会员延长时长必须大于 0");
        }
        MembershipType resolvedType = membershipType == null ? MembershipType.PLUS : membershipType;
        log.info(
            "Extending membership for user {} with tier {} by {} hours",
            userId,
            resolvedType,
            extension.toHours()
        );
        User user = loadUser(userId);
        LocalDateTime baseTime = evaluationTime;
        if (user.hasActiveMembershipAt(evaluationTime) && user.getMembershipExpiresAt() != null) {
            baseTime = user.getMembershipExpiresAt();
        }
        LocalDateTime newExpiresAt = baseTime.plus(extension);
        user.updateMembership(resolvedType, newExpiresAt, evaluationTime);
        return MembershipSnapshot.fromUser(user, evaluationTime);
    }

    /**
     * 意图：撤销用户会员身份。
     */
    @Transactional
    public void removeMembership(Long userId, LocalDateTime evaluationTime) {
        log.info("Removing membership for user {}", userId);
        User user = loadUser(userId);
        user.updateMembership(MembershipType.NONE, null, evaluationTime);
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }
}
