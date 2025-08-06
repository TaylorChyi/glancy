package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO representing a user's profile.
 */
@Data
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private Long userId;
    private Integer age;
    private String gender;
    private String job;
    private String interest;
    private String goal;
}
