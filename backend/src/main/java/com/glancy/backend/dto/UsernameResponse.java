package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Returned when querying or updating a user's username. */
@Data
@AllArgsConstructor
public class UsernameResponse {

  private String username;
}
