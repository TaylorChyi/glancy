package com.glancy.backend.service;

import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.UserProfile;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserProfileRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.profile.ProfileSectionCodec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 背景：
 *  - 画像字段瘦身后，服务层仍沿用可变 DTO 与 Entity 映射，易在未来扩展时遗漏必填字段或破坏幂等性。
 * 目的：
 *  - 以应用服务姿态负责用户画像的初始化、保存与读取，统一处理默认值与异常治理。
 * 关键决策与取舍：
 *  - 继续在服务层收敛事务边界，保持 `UserProfile` Entity 专注持久化；
 *  - 通过不可变 DTO 提供只读接口，避免遗漏字段写回；
 *  - 默认画像不足时延迟创建而非在注册时强制生成，降低耦合度。
 * 影响范围：
 *  - 控制器与个性化服务依赖的画像读取逻辑保持稳定。
 * 演进与TODO：
 *  - TODO: 若后续支持多画像版本或草稿态，可在此引入版本化或快照机制。
 */
@Slf4j
@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;
    private final ProfileSectionCodec profileSectionCodec;

    public UserProfileService(
        UserProfileRepository userProfileRepository,
        UserRepository userRepository,
        ProfileSectionCodec profileSectionCodec
    ) {
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
        this.profileSectionCodec = profileSectionCodec;
    }

    private UserProfile createDefaultProfile(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        return profile;
    }

    @Transactional
    public void initProfile(Long userId) {
        if (userProfileRepository.findByUserId(userId).isEmpty()) {
            log.info("Initializing default profile for user {}", userId);
            userProfileRepository.save(createDefaultProfile(userId));
        }
    }

    /**
     * Save the profile for a user.
     */
    @Transactional
    public UserProfileResponse saveProfile(Long userId, UserProfileRequest req) {
        log.info("Saving profile for user {}", userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
        UserProfile profile = userProfileRepository.findByUserId(userId).orElseGet(UserProfile::new);
        profile.setUser(user);
        profile.setEducation(req.education());
        profile.setJob(req.job());
        profile.setInterest(req.interest());
        profile.setGoal(req.goal());
        profile.setCurrentAbility(req.currentAbility());
        profile.setDailyWordTarget(req.dailyWordTarget());
        profile.setFuturePlan(req.futurePlan());
        profile.setCustomSections(profileSectionCodec.encode(req.customSections()));
        UserProfile saved = userProfileRepository.save(profile);
        return toResponse(saved);
    }

    /**
     * Fetch profile for a user.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        log.info("Fetching profile for user {}", userId);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElseGet(() -> createDefaultProfile(userId));
        return toResponse(profile);
    }

    private UserProfileResponse toResponse(UserProfile profile) {
        return new UserProfileResponse(
            profile.getId(),
            profile.getUser().getId(),
            profile.getEducation(),
            profile.getJob(),
            profile.getInterest(),
            profile.getGoal(),
            profile.getCurrentAbility(),
            profile.getDailyWordTarget(),
            profile.getFuturePlan(),
            profileSectionCodec.decode(profile.getCustomSections())
        );
    }
}
