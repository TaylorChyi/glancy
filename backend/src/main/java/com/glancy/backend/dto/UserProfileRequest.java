package com.glancy.backend.dto;

import lombok.Data;

/** Request body for saving user profile. */
@Data
public class UserProfileRequest {

  private Integer age;
  private String gender;
  private String job;
  private String interest;
  private String goal;
}
