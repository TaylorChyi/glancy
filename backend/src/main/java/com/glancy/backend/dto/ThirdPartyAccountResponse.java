package com.glancy.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Information about a successfully bound third-party account. */
@Data
@AllArgsConstructor
public class ThirdPartyAccountResponse {

  private Long id;
  private String provider;
  private String externalId;
  private Long userId;
}
