package com.glancy.backend.dto;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.WordIssueCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record WordIssueReportRequest(
    @NotBlank(message = "term is required") String term,
    @NotNull(message = "language is required") Language language,
    @NotNull(message = "flavor is required") DictionaryFlavor flavor,
    @NotNull(message = "category is required") WordIssueCategory category,
    @Size(max = 2000, message = "description is too long") String description,
    @Size(max = 500, message = "source url is too long") String sourceUrl
) {}
