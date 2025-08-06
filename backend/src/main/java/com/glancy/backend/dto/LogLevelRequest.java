package com.glancy.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for changing the log level of a logger at runtime.
 */
@Data
public class LogLevelRequest {

    @NotBlank(message = "{validation.logLevel.logger.notblank}")
    private String logger;

    @NotBlank(message = "{validation.logLevel.level.notblank}")
    private String level;
}
