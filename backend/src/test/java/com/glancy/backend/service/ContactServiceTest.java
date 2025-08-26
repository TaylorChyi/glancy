package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.ContactRequest;
import com.glancy.backend.dto.ContactResponse;
import com.glancy.backend.repository.ContactMessageRepository;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ContactServiceTest {

  @Autowired private ContactService contactService;

  @Autowired private ContactMessageRepository contactMessageRepository;

  @BeforeAll
  static void loadEnv() {
    Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
    String dbPassword = dotenv.get("DB_PASSWORD");
    if (dbPassword != null) {
      System.setProperty("DB_PASSWORD", dbPassword);
    }
  }

  @BeforeEach
  void setUp() {
    contactMessageRepository.deleteAll();
  }

  /** 测试 testSubmit 接口 */
  @Test
  void testSubmit() {
    ContactRequest req = new ContactRequest();
    req.setName("Alice");
    req.setEmail("alice@example.com");
    req.setMessage("Hi there");

    ContactResponse resp = contactService.submit(req);
    assertNotNull(resp.getId());
    assertEquals("Alice", resp.getName());
    assertEquals("alice@example.com", resp.getEmail());
    assertEquals("Hi there", resp.getMessage());
    assertEquals(1, contactMessageRepository.count());
  }
}
