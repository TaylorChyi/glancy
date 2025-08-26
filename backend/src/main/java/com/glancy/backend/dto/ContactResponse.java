package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Response after a contact message has been stored. */
@Data
@AllArgsConstructor
public class ContactResponse {

  private Long id;
  private String name;
  private String email;
  private String message;
}
