package com.glancy.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for submitting a contact message.
 */
@Data
public class ContactRequest {

    @NotBlank(message = "{validation.contact.name.notblank}")
    private String name;

    @NotBlank(message = "{validation.contact.email.notblank}")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "{validation.contact.message.notblank}")
    private String message;
}
