package com.glancy.backend.service.user;

import com.glancy.backend.dto.UserDetailResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class UserProfileQuery {

  private static final Logger log = LoggerFactory.getLogger(UserProfileQuery.class);

  private final UserRepository userRepository;
  private final UserResponseAssembler responseAssembler;

  public UserProfileQuery(UserRepository userRepository, UserResponseAssembler responseAssembler) {
    this.userRepository = userRepository;
    this.responseAssembler = responseAssembler;
  }

  /** 意图：查询原始用户实体。 */
  public User getUserRaw(Long id) {
    log.info("Fetching user {}", id);
    return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
  }

  /** 意图：查询用户详情并封装为 DTO。 */
  public UserDetailResponse getUserDetail(Long id) {
    User user = getUserRaw(id);
    return responseAssembler.toUserDetail(user);
  }
}
