package com.glancy.backend.mapper;

import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.SearchResultVersionSummaryResponse;
import com.glancy.backend.entity.SearchRecord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SearchRecordMapper {
    @Mapping(source = "record.user.id", target = "userId")
    @Mapping(target = "latestVersion", source = "summary")
    SearchRecordResponse toResponse(SearchRecord record, SearchResultVersionSummaryResponse summary);
}
