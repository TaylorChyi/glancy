package com.glancy.backend.mapper;

import com.glancy.backend.dto.SearchResultVersionResponse;
import com.glancy.backend.dto.SearchResultVersionSummaryResponse;
import com.glancy.backend.entity.SearchResultVersion;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SearchResultVersionMapper {
    @Mapping(source = "searchRecord.id", target = "searchRecordId")
    @Mapping(source = "word.id", target = "wordId")
    @Mapping(source = "user.id", target = "userId")
    SearchResultVersionResponse toResponse(SearchResultVersion version);

    @Mapping(source = "searchRecord.id", target = "searchRecordId")
    SearchResultVersionSummaryResponse toSummary(SearchResultVersion version);
}
