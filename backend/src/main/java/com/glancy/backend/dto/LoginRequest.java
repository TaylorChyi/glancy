package com.glancy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Parameters provided when a user attempts to log in.
 */
@Data
public class LoginRequest {

    /**
     * Account string entered by the user. May be a username, email or phone number.
     */
    private String account;

    @NotBlank(message = "{validation.login.password.notblank}")
    private String password;

    // Optional device information used during login
    private String deviceInfo;
}
