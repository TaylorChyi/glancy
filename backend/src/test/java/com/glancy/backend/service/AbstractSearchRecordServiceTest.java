package com.glancy.backend.service;

import com.glancy.backend.config.SearchProperties;
import com.glancy.backend.entity.User;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.SearchResultVersionRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
    properties = {
      "search.limit.nonMember=2",
      "oss.access-key-id=test-access-key",
      "oss.access-key-secret=test-access-secret",
      "oss.verify-location=false",
    })
@Transactional
abstract class AbstractSearchRecordServiceTest {

  @Autowired protected SearchRecordService searchRecordService;

  @Autowired protected SearchRecordRepository searchRecordRepository;

  @Autowired protected SearchResultVersionRepository searchResultVersionRepository;

  @Autowired protected UserRepository userRepository;

  @Autowired protected SearchProperties searchProperties;

  @BeforeAll
  static void loadEnv() {
    Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    String dbPassword = dotenv.get("DB_PASSWORD");
    if (dbPassword != null) {
      System.setProperty("DB_PASSWORD", dbPassword);
    }
  }

  @BeforeEach
  void cleanRepositories() {
    searchRecordRepository.deleteAll();
    searchResultVersionRepository.deleteAll();
    userRepository.deleteAll();
  }

  protected User persistUser(String username, String email) {
    User user = new User();
    user.setUsername(username);
    user.setPassword("p");
    user.setEmail(email);
    user.setPhone(String.valueOf(Math.abs(username.hashCode())));
    userRepository.save(user);
    return user;
  }
}
