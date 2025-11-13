package com.glancy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Request body used when updating a user's avatar. */
@Data
public class AvatarRequest {

    @NotBlank(message = "头像地址不能为空")
    private String avatar;
}
