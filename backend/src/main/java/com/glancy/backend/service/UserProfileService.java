package com.glancy.backend.service;

import com.glancy.backend.dto.ProfileCustomSectionDto;
import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.UserProfile;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserProfileRepository;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.profile.ProfileSectionCodec;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class UserProfileService {

  private final UserProfileRepository userProfileRepository;
  private final UserRepository userRepository;
  private final ProfileSectionCodec profileSectionCodec;

  public UserProfileService(
      UserProfileRepository userProfileRepository,
      UserRepository userRepository,
      ProfileSectionCodec profileSectionCodec) {
    this.userProfileRepository = userProfileRepository;
    this.userRepository = userRepository;
    this.profileSectionCodec = profileSectionCodec;
  }

  private UserProfile createDefaultProfile(Long userId) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
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

  /** Save the profile for a user. */
  @Transactional
  public UserProfileResponse saveProfile(Long userId, UserProfileRequest req) {
    log.info("Saving profile for user {}", userId);
    User user =
        userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    UserProfile profile = userProfileRepository.findByUserId(userId).orElseGet(UserProfile::new);
    profile.setUser(user);
    profile.setJob(req.job());
    profile.setInterest(req.interest());
    profile.setGoal(req.goal());
    profile.setEducation(req.education());
    profile.setCurrentAbility(req.currentAbility());
    profile.setDailyWordTarget(req.dailyWordTarget());
    profile.setFuturePlan(req.futurePlan());
    profile.setResponseStyle(req.responseStyle());
    profile.setCustomSections(profileSectionCodec.serialize(req.customSections()));
    UserProfile saved = userProfileRepository.save(profile);
    return toResponse(saved);
  }

  /** Fetch profile for a user. */
  @Transactional(readOnly = true)
  public UserProfileResponse getProfile(Long userId) {
    log.info("Fetching profile for user {}", userId);
    UserProfile profile =
        userProfileRepository.findByUserId(userId).orElseGet(() -> createDefaultProfile(userId));
    return toResponse(profile);
  }

  private UserProfileResponse toResponse(UserProfile profile) {
    List<ProfileCustomSectionDto> customSections =
        profileSectionCodec.deserialize(profile.getCustomSections());
    return new UserProfileResponse(
        profile.getId(),
        profile.getUser().getId(),
        profile.getJob(),
        profile.getInterest(),
        profile.getGoal(),
        profile.getEducation(),
        profile.getCurrentAbility(),
        profile.getDailyWordTarget(),
        profile.getFuturePlan(),
        profile.getResponseStyle(),
        customSections);
  }
}
