package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Returned when querying or updating a user's avatar.
 */
@Data
@AllArgsConstructor
public class AvatarResponse {

    private String avatar;
}
