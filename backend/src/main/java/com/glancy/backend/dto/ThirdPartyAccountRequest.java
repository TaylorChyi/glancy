package com.glancy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Payload for binding an external account to a user.
 */
@Data
public class ThirdPartyAccountRequest {

    @NotBlank(message = "{validation.thirdPartyAccount.provider.notblank}")
    private String provider;

    @NotBlank(message = "{validation.thirdPartyAccount.externalId.notblank}")
    private String externalId;
}
