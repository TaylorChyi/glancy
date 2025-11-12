package com.glancy.backend.service;

import com.glancy.backend.dto.UserPreferenceRequest;
import com.glancy.backend.dto.UserPreferenceResponse;
import com.glancy.backend.dto.UserPreferenceUpdateRequest;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.UserPreference;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserPreferenceRepository;
import com.glancy.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Stores and retrieves per-user settings such as theme and preferred languages. */
@Slf4j
@Service
public class UserPreferenceService {

  private final UserPreferenceRepository userPreferenceRepository;
  private final UserRepository userRepository;

  private static final String DEFAULT_THEME = "light";
  private static final String DEFAULT_SYSTEM_LANGUAGE = "en";
  private static final String DEFAULT_SEARCH_LANGUAGE = "en";

  public UserPreferenceService(
      UserPreferenceRepository userPreferenceRepository, UserRepository userRepository) {
    this.userPreferenceRepository = userPreferenceRepository;
    this.userRepository = userRepository;
  }

  private UserPreference createDefaultPreference(Long userId) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    UserPreference pref = new UserPreference();
    pref.setUser(user);
    pref.setTheme(DEFAULT_THEME);
    pref.setSystemLanguage(DEFAULT_SYSTEM_LANGUAGE);
    pref.setSearchLanguage(DEFAULT_SEARCH_LANGUAGE);
    return pref;
  }

  /** Save UI and language preferences for a user. */
  @Transactional
  public UserPreferenceResponse savePreference(Long userId, UserPreferenceRequest req) {
    log.info("Saving preferences for user {}", userId);
    User user =
        userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    UserPreference pref =
        userPreferenceRepository.findByUserId(userId).orElse(new UserPreference());
    pref.setUser(user);
    pref.setTheme(req.getTheme());
    pref.setSystemLanguage(req.getSystemLanguage());
    pref.setSearchLanguage(req.getSearchLanguage());
    UserPreference saved = userPreferenceRepository.save(pref);
    return toResponse(saved);
  }

  /** Retrieve preferences previously saved for the user. */
  @Transactional(readOnly = true)
  public UserPreferenceResponse getPreference(Long userId) {
    log.info("Fetching preferences for user {}", userId);
    UserPreference pref =
        userPreferenceRepository
            .findByUserId(userId)
            .orElseGet(() -> createDefaultPreference(userId));
    return toResponse(pref);
  }

  /** Partially update user preferences while preserving unspecified values. */
  @Transactional
  public UserPreferenceResponse updatePreference(Long userId, UserPreferenceUpdateRequest req) {
    log.info("Updating preferences for user {}", userId);
    UserPreference pref =
        userPreferenceRepository
            .findByUserId(userId)
            .orElseGet(() -> createDefaultPreference(userId));

    if (req.getTheme() != null) {
      pref.setTheme(req.getTheme());
    }
    if (req.getSystemLanguage() != null) {
      pref.setSystemLanguage(req.getSystemLanguage());
    }
    if (req.getSearchLanguage() != null) {
      pref.setSearchLanguage(req.getSearchLanguage());
    }

    UserPreference saved = userPreferenceRepository.save(pref);
    return toResponse(saved);
  }

  private UserPreferenceResponse toResponse(UserPreference pref) {
    return new UserPreferenceResponse(
        pref.getId(),
        pref.getUser().getId(),
        pref.getTheme(),
        pref.getSystemLanguage(),
        pref.getSearchLanguage());
  }
}
