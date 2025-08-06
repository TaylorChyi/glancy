package com.glancy.backend.dto;

import com.glancy.backend.entity.Language;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Represents a saved search history item returned to the client.
 */
@Data
@AllArgsConstructor
public class SearchRecordResponse {

    private Long id;
    private Long userId;
    private String term;
    private Language language;
    private LocalDateTime createdAt;
    private Boolean favorite;
}
