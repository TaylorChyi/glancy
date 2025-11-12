package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.AvatarRequest;
import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.dto.EmailChangeInitiationRequest;
import com.glancy.backend.dto.EmailChangeRequest;
import com.glancy.backend.dto.EmailLoginRequest;
import com.glancy.backend.dto.EmailRegistrationRequest;
import com.glancy.backend.dto.EmailVerificationCodeRequest;
import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.LoginResponse;
import com.glancy.backend.dto.ThirdPartyAccountRequest;
import com.glancy.backend.dto.ThirdPartyAccountResponse;
import com.glancy.backend.dto.UserContactRequest;
import com.glancy.backend.dto.UserContactResponse;
import com.glancy.backend.dto.UserDetailResponse;
import com.glancy.backend.dto.UserEmailResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.dto.UsernameRequest;
import com.glancy.backend.dto.UsernameResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.service.UserService;
import com.glancy.backend.util.ClientIpResolver;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** User management endpoints including registration, login and third-party account binding. */
@RestController
@RequestMapping("/api/users")
@Slf4j
public class UserController {

  private final UserService userService;
  private final ClientIpResolver clientIpResolver;

  public UserController(UserService userService, ClientIpResolver clientIpResolver) {
    this.userService = userService;
    this.clientIpResolver = clientIpResolver;
  }

  /** Register a new user account. */
  @PostMapping("/register")
  public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegistrationRequest req) {
    UserResponse resp = userService.register(req);
    return new ResponseEntity<>(resp, HttpStatus.CREATED);
  }

  /** Request an email verification code for registration or login. */
  @PostMapping("/email/verification-code")
  public ResponseEntity<Void> sendVerificationCode(
      @Valid @RequestBody EmailVerificationCodeRequest req, HttpServletRequest httpRequest) {
    log.info("Email verification code request received for purpose {}", req.purpose());
    String clientIp = clientIpResolver.resolve(httpRequest);
    userService.sendVerificationCode(req, clientIp);
    log.info(
        "Email verification code request processed for purpose {} with response status {}",
        req.purpose(),
        HttpStatus.ACCEPTED);
    return ResponseEntity.accepted().build();
  }

  /** Register a user account after validating an email verification code. */
  @PostMapping("/register/email")
  public ResponseEntity<UserResponse> registerWithEmail(
      @Valid @RequestBody EmailRegistrationRequest req) {
    UserResponse resp = userService.registerWithEmailVerification(req);
    return new ResponseEntity<>(resp, HttpStatus.CREATED);
  }

  /** Delete (logically) an existing user account. */
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    userService.deleteUser(id);
    return ResponseEntity.noContent().build();
  }

  /** Fetch user information regardless of deletion status. */
  @GetMapping("/{id}")
  public ResponseEntity<UserDetailResponse> getUser(@PathVariable Long id) {
    UserDetailResponse user = userService.getUserDetail(id);
    return ResponseEntity.ok(user);
  }

  /** Authenticate a user with username/email and password. */
  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
    LoginResponse resp = userService.login(req);
    return new ResponseEntity<>(resp, HttpStatus.OK);
  }

  /** Authenticate using an email verification code instead of a password. */
  @PostMapping("/login/email")
  public ResponseEntity<LoginResponse> loginWithEmail(@Valid @RequestBody EmailLoginRequest req) {
    LoginResponse resp = userService.loginWithEmailCode(req);
    return new ResponseEntity<>(resp, HttpStatus.OK);
  }

  /** Log out a user by clearing their login token. */
  @PostMapping("/{id}/logout")
  public ResponseEntity<Void> logout(@AuthenticatedUser User user) {
    userService.logout(user.getId(), user.getLoginToken());
    return ResponseEntity.noContent().build();
  }

  /** Bind a third-party account to the specified user. */
  @PostMapping("/{id}/third-party-accounts")
  public ResponseEntity<ThirdPartyAccountResponse> bindThirdParty(
      @PathVariable Long id, @Valid @RequestBody ThirdPartyAccountRequest req) {
    ThirdPartyAccountResponse resp = userService.bindThirdPartyAccount(id, req);
    return new ResponseEntity<>(resp, HttpStatus.CREATED);
  }

  /** Get the avatar URL for a specific user. */
  @GetMapping("/{id}/avatar")
  public ResponseEntity<AvatarResponse> getAvatar(@PathVariable Long id) {
    AvatarResponse resp = userService.getAvatar(id);
    return ResponseEntity.ok(resp);
  }

  /** Update the avatar URL for a user. */
  @PutMapping("/{id}/avatar")
  public ResponseEntity<AvatarResponse> updateAvatar(
      @PathVariable Long id, @Valid @RequestBody AvatarRequest req) {
    AvatarResponse resp = userService.updateAvatar(id, req.getAvatar());
    return ResponseEntity.ok(resp);
  }

  /** Upload avatar file to OSS and update user record. */
  @PostMapping("/{id}/avatar-file")
  public ResponseEntity<AvatarResponse> uploadAvatar(
      @PathVariable Long id, @RequestParam("file") MultipartFile file) {
    AvatarResponse resp = userService.uploadAvatar(id, file);
    return ResponseEntity.ok(resp);
  }

  /** Update the username for a user. */
  @PutMapping("/{id}/username")
  public ResponseEntity<UsernameResponse> updateUsername(
      @PathVariable Long id, @Valid @RequestBody UsernameRequest req) {
    UsernameResponse resp = userService.updateUsername(id, req.getUsername());
    return ResponseEntity.ok(resp);
  }

  /** Update the email and phone for a user. */
  @PutMapping("/{id}/contact")
  public ResponseEntity<UserContactResponse> updateContact(
      @PathVariable Long id, @Valid @RequestBody UserContactRequest req) {
    UserContactResponse resp = userService.updateContact(id, req.email(), req.phone());
    return ResponseEntity.ok(resp);
  }

  /** Dispatch a verification code to the target email before switching bindings. */
  @PostMapping("/{id}/email/change-code")
  public ResponseEntity<Void> requestEmailChangeCode(
      @PathVariable Long id,
      @Valid @RequestBody EmailChangeInitiationRequest req,
      HttpServletRequest httpRequest) {
    log.info("Received email change code request for user {}", id);
    String clientIp = clientIpResolver.resolve(httpRequest);
    userService.requestEmailChangeCode(id, req.email(), clientIp);
    return ResponseEntity.accepted().build();
  }

  /** Bind a new email to the user after verifying the code. */
  @PutMapping("/{id}/email")
  public ResponseEntity<UserEmailResponse> changeEmail(
      @PathVariable Long id, @Valid @RequestBody EmailChangeRequest req) {
    UserEmailResponse resp = userService.changeEmail(id, req.email(), req.code());
    return ResponseEntity.ok(resp);
  }

  /** Remove the email binding so the user can no longer sign in via email. */
  @DeleteMapping("/{id}/email")
  public ResponseEntity<UserEmailResponse> unbindEmail(@PathVariable Long id) {
    UserEmailResponse resp = userService.unbindEmail(id);
    return ResponseEntity.ok(resp);
  }

  /** Get the total number of active users. */
  @GetMapping("/count")
  public ResponseEntity<Long> countUsers() {
    long count = userService.countActiveUsers();
    return ResponseEntity.ok(count);
  }
}
