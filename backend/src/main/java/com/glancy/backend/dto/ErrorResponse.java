package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Simple error response body. */
@Data
@AllArgsConstructor
public class ErrorResponse {

  private String message;
}
