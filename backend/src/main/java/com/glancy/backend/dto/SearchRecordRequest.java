package com.glancy.backend.dto;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Request payload representing a user's word search. */
@Data
public class SearchRecordRequest {

    @NotBlank(message = "{validation.searchRecord.term.notblank}")
    private String term;

    @NotNull(message = "{validation.searchRecord.language.notnull}")
    private Language language;

    private DictionaryFlavor flavor = DictionaryFlavor.BILINGUAL;
}
