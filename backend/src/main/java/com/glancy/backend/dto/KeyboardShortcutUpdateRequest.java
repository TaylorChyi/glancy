package com.glancy.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record KeyboardShortcutUpdateRequest(
    @NotNull @NotEmpty @Size(max = 4) List<@NotNull @Size(min = 1, max = 40) String> keys
) {}
