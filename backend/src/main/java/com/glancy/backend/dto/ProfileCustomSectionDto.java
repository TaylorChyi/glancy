package com.glancy.backend.dto;


import java.util.List;

public record ProfileCustomSectionDto(
    /** 自定义大项标题 */
    String title,
    /** 大项内的细分条目集合 */
    List<ProfileCustomSectionItemDto> items
) {
    public ProfileCustomSectionDto {
        items = items == null ? List.of() : List.copyOf(items);
    }
}
