package com.glancy.backend.dto;

import com.glancy.backend.entity.Language;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WordResponse {

    private String id;
    private String term;
    private List<String> definitions;
    private Language language;
    private String example;
    private String phonetic;
    private List<String> variations;
    private List<String> synonyms;
    private List<String> antonyms;
    private List<String> related;
    private List<String> phrases;
    private String markdown;
    private Long versionId;
    private PersonalizedWordExplanation personalization;
}
