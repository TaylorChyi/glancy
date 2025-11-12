package com.glancy.backend.service;

import com.glancy.backend.dto.UserContactResponse;
import com.glancy.backend.dto.UserEmailResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.exception.InvalidRequestException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class UserServiceEmailChangeTest extends AbstractUserServiceTest {

  @Test
  void testUpdateContact() {
    UserRegistrationRequest req = new UserRegistrationRequest();
    req.setUsername("contactUser");
    req.setPassword("pass123");
    req.setEmail("contact@example.com");
    req.setPhone("1234567");
    UserResponse created = userService.register(req);

    UserContactResponse updated =
        userService.updateContact(created.getId(), "contact@example.com", "7654321");

    Assertions.assertEquals("contact@example.com", updated.email());
    Assertions.assertEquals("7654321", updated.phone());

    User persisted = userRepository.findById(created.getId()).orElseThrow();
    Assertions.assertEquals("contact@example.com", persisted.getEmail());
    Assertions.assertEquals("7654321", persisted.getPhone());

    InvalidRequestException exception =
        Assertions.assertThrows(
            InvalidRequestException.class,
            () -> userService.updateContact(created.getId(), "changed@example.com", "7654321"));
    Assertions.assertEquals("请通过邮箱换绑流程完成更新", exception.getMessage());
  }

  @Test
  void testRequestEmailChangeCode() {
    UserRegistrationRequest req = new UserRegistrationRequest();
    req.setUsername("emailchange");
    req.setPassword("pass123");
    req.setEmail("change@example.com");
    req.setPhone("4567");
    UserResponse created = userService.register(req);

    Mockito.doNothing()
        .when(emailVerificationService)
        .issueCode("next@example.com", EmailVerificationPurpose.CHANGE_EMAIL, CLIENT_IP);

    userService.requestEmailChangeCode(created.getId(), "next@example.com", CLIENT_IP);

    Mockito.verify(emailVerificationService)
        .issueCode("next@example.com", EmailVerificationPurpose.CHANGE_EMAIL, CLIENT_IP);
  }

  @Test
  void testChangeEmail() {
    UserRegistrationRequest req = new UserRegistrationRequest();
    req.setUsername("emailchange2");
    req.setPassword("pass123");
    req.setEmail("before@example.com");
    req.setPhone("6543");
    UserResponse created = userService.register(req);

    Mockito.doNothing()
        .when(emailVerificationService)
        .consumeCode("after@example.com", "123456", EmailVerificationPurpose.CHANGE_EMAIL);

    UserEmailResponse response =
        userService.changeEmail(created.getId(), "after@example.com", "123456");

    Assertions.assertEquals("after@example.com", response.email());
    Assertions.assertEquals(
        "after@example.com", userRepository.findById(created.getId()).orElseThrow().getEmail());
  }

  @Test
  void testUnbindEmail() {
    UserRegistrationRequest req = new UserRegistrationRequest();
    req.setUsername("emailunbind");
    req.setPassword("pass123");
    req.setEmail("unbind@example.com");
    req.setPhone("9876");
    UserResponse created = userService.register(req);

    UserEmailResponse response = userService.unbindEmail(created.getId());

    Assertions.assertNull(response.email());
    Mockito.verify(emailVerificationService)
        .invalidateCodes("unbind@example.com", EmailVerificationPurpose.CHANGE_EMAIL);
    UserEmailResponse second = userService.unbindEmail(created.getId());
    Assertions.assertNull(second.email());
    Mockito.verifyNoMoreInteractions(emailVerificationService);
    Assertions.assertNull(userRepository.findById(created.getId()).orElseThrow().getEmail());
  }

  @Test
  void Given_SameEmail_When_RequestEmailChangeCode_Then_Reject() {
    UserRegistrationRequest req = new UserRegistrationRequest();
    req.setUsername("sameEmailUser");
    req.setPassword("pass123");
    req.setEmail("primary@example.com");
    req.setPhone("7777");
    UserResponse created = userService.register(req);

    Mockito.clearInvocations(emailVerificationService);

    InvalidRequestException exception =
        Assertions.assertThrows(
            InvalidRequestException.class,
            () ->
                userService.requestEmailChangeCode(
                    created.getId(), "Primary@Example.com", CLIENT_IP));

    Assertions.assertEquals("新邮箱不能与当前邮箱相同", exception.getMessage());
    Mockito.verifyNoInteractions(emailVerificationService);
  }

  @Test
  void Given_EmailOccupiedByOtherUser_When_RequestEmailChangeCode_Then_ThrowDuplicate() {
    UserRegistrationRequest first = new UserRegistrationRequest();
    first.setUsername("firstUser");
    first.setPassword("pass123");
    first.setEmail("first@example.com");
    first.setPhone("8888");
    UserResponse firstUser = userService.register(first);

    UserRegistrationRequest second = new UserRegistrationRequest();
    second.setUsername("secondUser");
    second.setPassword("pass456");
    second.setEmail("target@example.com");
    second.setPhone("9999");
    userService.register(second);

    Mockito.clearInvocations(emailVerificationService);

    DuplicateResourceException exception =
        Assertions.assertThrows(
            DuplicateResourceException.class,
            () ->
                userService.requestEmailChangeCode(
                    firstUser.getId(), "TARGET@example.com", CLIENT_IP));

    Assertions.assertEquals("邮箱已被使用", exception.getMessage());
    Mockito.verifyNoInteractions(emailVerificationService);
  }

  @Test
  void Given_BlankCode_When_ChangeEmail_Then_ThrowInvalidRequest() {
    UserRegistrationRequest req = new UserRegistrationRequest();
    req.setUsername("blankCodeUser");
    req.setPassword("pass123");
    req.setEmail("before-change@example.com");
    req.setPhone("5555");
    UserResponse created = userService.register(req);

    Mockito.clearInvocations(emailVerificationService);

    InvalidRequestException exception =
        Assertions.assertThrows(
            InvalidRequestException.class,
            () -> userService.changeEmail(created.getId(), "after-change@example.com", "   "));

    Assertions.assertEquals("验证码不能为空", exception.getMessage());
    Mockito.verifyNoInteractions(emailVerificationService);
  }

  @Test
  void Given_BlankEmail_When_RequestEmailChangeCode_Then_ThrowInvalidRequest() {
    UserRegistrationRequest req = new UserRegistrationRequest();
    req.setUsername("blankemail");
    req.setPassword("pass123");
    req.setEmail("blank@example.com");
    req.setPhone("0000");
    UserResponse created = userService.register(req);

    Mockito.clearInvocations(emailVerificationService);

    InvalidRequestException exception =
        Assertions.assertThrows(
            InvalidRequestException.class,
            () -> userService.requestEmailChangeCode(created.getId(), "   ", CLIENT_IP));

    Assertions.assertEquals("邮箱不能为空", exception.getMessage());
    Mockito.verifyNoInteractions(emailVerificationService);
  }

  @Test
  void Given_CodeWithWhitespace_When_ChangeEmail_Then_TrimBeforeConsume() {
    UserRegistrationRequest req = new UserRegistrationRequest();
    req.setUsername("trimcode");
    req.setPassword("pass123");
    req.setEmail("trim-before@example.com");
    req.setPhone("1111");
    UserResponse created = userService.register(req);

    Mockito.doNothing()
        .when(emailVerificationService)
        .consumeCode("after@example.com", "654321", EmailVerificationPurpose.CHANGE_EMAIL);

    UserEmailResponse response =
        userService.changeEmail(created.getId(), "after@example.com", " 654321 ");

    Assertions.assertEquals("after@example.com", response.email());
    Mockito.verify(emailVerificationService)
        .consumeCode("after@example.com", "654321", EmailVerificationPurpose.CHANGE_EMAIL);
  }
}
