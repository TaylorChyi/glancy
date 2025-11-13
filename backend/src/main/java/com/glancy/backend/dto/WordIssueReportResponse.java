package com.glancy.backend.dto;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.WordIssueCategory;
import java.time.LocalDateTime;

public record WordIssueReportResponse(
        Long id,
        String term,
        Language language,
        DictionaryFlavor flavor,
        WordIssueCategory category,
        String description,
        String sourceUrl,
        LocalDateTime createdAt) {}
