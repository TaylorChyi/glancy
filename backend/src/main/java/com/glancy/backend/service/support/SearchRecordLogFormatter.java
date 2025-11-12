package com.glancy.backend.service.support;

import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.SearchRecord;

public final class SearchRecordLogFormatter {

    private SearchRecordLogFormatter() {}

    public static String record(SearchRecord record) {
        if (record == null) {
            return "null";
        }
        Long uid = record.getUser() != null ? record.getUser().getId() : null;
        return String.format(
            "id=%d, userId=%s, term='%s', language=%s, flavor=%s, favorite=%s, createdAt=%s, deleted=%s",
            record.getId(),
            uid,
            record.getTerm(),
            record.getLanguage(),
            record.getFlavor(),
            record.getFavorite(),
            record.getCreatedAt(),
            record.getDeleted()
        );
    }

    public static String response(SearchRecordResponse response) {
        if (response == null) {
            return "null";
        }
        return String.format(
            "id=%d, userId=%s, term='%s', language=%s, flavor=%s, favorite=%s, createdAt=%s, " +
            "versions=%d, latestVersion=%s",
            response.id(),
            response.userId(),
            response.term(),
            response.language(),
            response.flavor(),
            response.favorite(),
            response.createdAt(),
            response.versions().size(),
            response.latestVersion() != null ? response.latestVersion().versionNumber() : null
        );
    }
}
