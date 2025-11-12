package com.glancy.backend.service.search.dto;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import lombok.Builder;
import lombok.Getter;

/**
 * 聚合创建 SearchResultVersion 所需上下文，避免调用层传递冗长参数列表。
 */
@Getter
@Builder
public class CreateVersionCommand {

    private final Long recordId;
    private final Long userId;
    private final String term;
    private final Language language;
    private final String model;
    private final String content;
    private final Word word;
    private final DictionaryFlavor flavor;
}
