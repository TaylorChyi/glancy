package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Data returned to the client upon successful login. */
@Data
@AllArgsConstructor
public class LoginResponse {

  private Long id;
  private String username;
  private String email;
  private String avatar;
  private String phone;
  private Boolean member;
  private String token;
}
