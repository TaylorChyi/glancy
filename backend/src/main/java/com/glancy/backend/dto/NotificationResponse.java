package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** DTO returned when a notification is created or queried. */
@Data
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private String message;
    private Boolean systemLevel;
    private Long userId;
}
