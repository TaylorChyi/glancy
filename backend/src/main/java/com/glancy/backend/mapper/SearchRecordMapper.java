package com.glancy.backend.mapper;

import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.SearchRecord;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SearchRecordMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(target = "versions", expression = "java(java.util.List.of())")
    @Mapping(target = "latestVersion", expression = "java(null)")
    SearchRecordResponse toResponse(SearchRecord record);
}
