package com.glancy.backend.service.word;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.Word;
import com.glancy.backend.service.SearchResultService;
import com.glancy.backend.service.search.dto.CreateVersionCommand;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SearchResultVersionWriter {

  private final SearchResultService searchResultService;

  public SearchResultVersion persistVersion(
      Long recordId,
      Long userId,
      String model,
      String content,
      Word word,
      DictionaryFlavor flavor) {
    if (recordId == null) {
      return null;
    }
    CreateVersionCommand command =
        CreateVersionCommand.builder()
            .recordId(recordId)
            .userId(userId)
            .term(word.getTerm())
            .language(word.getLanguage())
            .model(model)
            .content(content)
            .word(word)
            .flavor(flavor)
            .build();
    return searchResultService.createVersion(command);
  }
}
