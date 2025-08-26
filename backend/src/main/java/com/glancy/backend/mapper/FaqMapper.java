package com.glancy.backend.mapper;

import com.glancy.backend.dto.FaqResponse;
import com.glancy.backend.entity.Faq;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FaqMapper {
  FaqResponse toResponse(Faq faq);
}
