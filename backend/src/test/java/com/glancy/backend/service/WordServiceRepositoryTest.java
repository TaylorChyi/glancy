package com.glancy.backend.service;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class WordServiceRepositoryTest extends BaseWordServiceTest {

  @Test
  void testSaveSameTermDifferentLanguage() {
    Word wordEn = new Word();
    wordEn.setTerm("hello");
    wordEn.setNormalizedTerm("hello");
    wordEn.setLanguage(Language.ENGLISH);
    wordEn.setFlavor(DictionaryFlavor.BILINGUAL);
    wordEn.setDefinitions(List.of("greet"));
    wordRepository.save(wordEn);

    Word wordZh = new Word();
    wordZh.setTerm("hello");
    wordZh.setNormalizedTerm("hello");
    wordZh.setLanguage(Language.CHINESE);
    wordZh.setFlavor(DictionaryFlavor.BILINGUAL);
    wordZh.setDefinitions(List.of("你好"));

    Assertions.assertDoesNotThrow(() -> wordRepository.save(wordZh));

    Assertions.assertTrue(
        wordRepository
            .findActiveByNormalizedTerm("hello", Language.ENGLISH, DictionaryFlavor.BILINGUAL)
            .isPresent());
    Assertions.assertTrue(
        wordRepository
            .findActiveByNormalizedTerm("hello", Language.CHINESE, DictionaryFlavor.BILINGUAL)
            .isPresent());
  }
}
