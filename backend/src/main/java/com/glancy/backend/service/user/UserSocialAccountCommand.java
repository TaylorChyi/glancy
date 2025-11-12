package com.glancy.backend.service.user;

import com.glancy.backend.dto.ThirdPartyAccountRequest;
import com.glancy.backend.dto.ThirdPartyAccountResponse;
import com.glancy.backend.entity.ThirdPartyAccount;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.ThirdPartyAccountRepository;
import com.glancy.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class UserSocialAccountCommand {

  private static final Logger log = LoggerFactory.getLogger(UserSocialAccountCommand.class);

  private final UserRepository userRepository;
  private final ThirdPartyAccountRepository thirdPartyAccountRepository;

  public UserSocialAccountCommand(
      UserRepository userRepository, ThirdPartyAccountRepository thirdPartyAccountRepository) {
    this.userRepository = userRepository;
    this.thirdPartyAccountRepository = thirdPartyAccountRepository;
  }

  /** 意图：绑定第三方账号到指定用户。 */
  public ThirdPartyAccountResponse bindThirdPartyAccount(
      Long userId, ThirdPartyAccountRequest request) {
    log.info("Binding {} account for user {}", request.getProvider(), userId);
    User user =
        userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    thirdPartyAccountRepository
        .findByProviderAndExternalId(request.getProvider(), request.getExternalId())
        .ifPresent(
            existing -> {
              log.warn(
                  "Third-party account {}:{} already bound",
                  request.getProvider(),
                  request.getExternalId());
              throw new DuplicateResourceException("该第三方账号已绑定");
            });
    ThirdPartyAccount account = new ThirdPartyAccount();
    account.setUser(user);
    account.setProvider(request.getProvider());
    account.setExternalId(request.getExternalId());
    ThirdPartyAccount saved = thirdPartyAccountRepository.save(account);
    return new ThirdPartyAccountResponse(
        saved.getId(), saved.getProvider(), saved.getExternalId(), saved.getUser().getId());
  }
}
