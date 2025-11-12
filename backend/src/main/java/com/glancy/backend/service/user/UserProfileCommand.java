package com.glancy.backend.service.user;

import com.glancy.backend.dto.UsernameResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class UserProfileCommand {

  private static final Logger log = LoggerFactory.getLogger(UserProfileCommand.class);

  private final UserRepository userRepository;

  public UserProfileCommand(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  /** 意图：逻辑删除用户。 */
  public void deleteUser(Long id) {
    log.info("Deleting user {}", id);
    User user =
        userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    user.setDeleted(true);
    userRepository.save(user);
  }

  /** 意图：更新用户名并保持唯一约束。 */
  public UsernameResponse updateUsername(Long userId, String username) {
    log.info("Updating username for user {}", userId);
    userRepository
        .findByUsernameAndDeletedFalse(username)
        .ifPresent(
            existing -> {
              throw new DuplicateResourceException("用户名已存在");
            });
    User user =
        userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    user.setUsername(username);
    User saved = userRepository.save(user);
    return new UsernameResponse(saved.getUsername());
  }
}
