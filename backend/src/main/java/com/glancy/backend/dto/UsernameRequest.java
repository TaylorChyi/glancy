package com.glancy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Request body used when updating a user's username. */
@Data
public class UsernameRequest {

    @NotBlank(message = "用户名不能为空")
    private String username;
}
