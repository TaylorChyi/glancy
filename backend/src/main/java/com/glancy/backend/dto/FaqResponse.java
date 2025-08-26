package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Response returned for FAQ queries. */
@Data
@AllArgsConstructor
public class FaqResponse {

  private Long id;
  private String question;
  private String answer;
}
