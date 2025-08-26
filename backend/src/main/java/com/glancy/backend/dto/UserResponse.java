package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Basic user information returned by many endpoints. */
@Data
@AllArgsConstructor
public class UserResponse {

  private Long id;
  private String username;
  private String email;
  private String avatar;
  private String phone;
}
