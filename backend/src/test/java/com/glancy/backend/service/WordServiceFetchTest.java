package com.glancy.backend.service;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.Word;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class WordServiceFetchTest extends BaseWordServiceTest {

    @Test
    void testFetchAndCacheWord() {
        WordResponse result = wordService.findWordForUser(
            userId,
            options("hello", Language.ENGLISH, DictionaryFlavor.BILINGUAL, null, false, true)
        );

        Assertions.assertNotNull(result.getId());
        Assertions.assertTrue(wordRepository.findById(Long.parseLong(result.getId())).isPresent());
    }

    @Test
    void testUseCachedWord() {
        Word word = new Word();
        word.setTerm("cached");
        word.setNormalizedTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(List.of("store"));
        word.setMarkdown("md");
        wordRepository.save(word);

        WordResponse result = wordService.findWordForUser(
            userId,
            options("CACHED", Language.ENGLISH, DictionaryFlavor.BILINGUAL, null, false, true)
        );

        Assertions.assertEquals(String.valueOf(word.getId()), result.getId());
        Assertions.assertEquals("md", result.getMarkdown());
    }

    @Test
    void testUseCachedWordWithWhitespace() {
        Word word = new Word();
        word.setTerm("cached");
        word.setNormalizedTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(List.of("store"));
        word.setMarkdown("md");
        wordRepository.save(word);

        WordResponse result = wordService.findWordForUser(
            userId,
            options("  cached  ", Language.ENGLISH, DictionaryFlavor.BILINGUAL, null, false, true)
        );

        Assertions.assertEquals(String.valueOf(word.getId()), result.getId());
    }

    @Test
    void reuseHistoryWhenCacheHitWithDifferentCase() {
        Word word = new Word();
        word.setTerm("cached");
        word.setNormalizedTerm("cached");
        word.setLanguage(Language.ENGLISH);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(List.of("store"));
        word.setMarkdown("md");
        wordRepository.save(word);

        wordService.findWordForUser(
            userId,
            options("CACHED", Language.ENGLISH, DictionaryFlavor.BILINGUAL, null, false, true)
        );

        List<SearchRecord> afterFirstQuery = searchRecordRepository.findByUserIdAndDeletedFalse(userId);
        Assertions.assertEquals(1, afterFirstQuery.size(), "首次命中缓存时应只创建一条历史记录");
        Assertions.assertEquals("cached", afterFirstQuery.get(0).getTerm(), "历史记录词条应被同步为规范小写形式");

        wordService.findWordForUser(
            userId,
            options("cached", Language.ENGLISH, DictionaryFlavor.BILINGUAL, null, false, true)
        );

        List<SearchRecord> afterSecondQuery = searchRecordRepository.findByUserIdAndDeletedFalse(userId);
        Assertions.assertEquals(1, afterSecondQuery.size(), "再次查询不应生成新的历史记录");
        Assertions.assertEquals("cached", afterSecondQuery.get(0).getTerm(), "历史记录词条应保持规范形式");
    }

    @Test
    void testCacheWordWhenLanguageMissing() {
        WordResponse result = wordService.findWordForUser(
            userId,
            options("bye", Language.ENGLISH, DictionaryFlavor.BILINGUAL, null, false, true)
        );

        Assertions.assertEquals(Language.ENGLISH, result.getLanguage());
        Assertions.assertTrue(
            wordRepository.findActiveByNormalizedTerm("bye", Language.ENGLISH, DictionaryFlavor.BILINGUAL).isPresent()
        );
    }

    @Test
    void testFindWordSkipsHistoryWhenDisabled() {
        wordService.findWordForUser(
            userId,
            options("skip", Language.ENGLISH, DictionaryFlavor.BILINGUAL, null, false, false)
        );

        Assertions.assertEquals(0, searchRecordRepository.count(), "搜索记录应保持为空");
        Assertions.assertEquals(0, searchResultVersionRepository.count(), "版本记录应保持为空");
    }

    @Test
    void testUseCachedWordWithPunctuation() {
        Word word = new Word();
        word.setTerm("hello");
        word.setNormalizedTerm("hello");
        word.setLanguage(Language.ENGLISH);
        word.setFlavor(DictionaryFlavor.BILINGUAL);
        word.setDefinitions(List.of("greeting"));
        word.setMarkdown("hello-md");
        wordRepository.save(word);

        WordResponse result = wordService.findWordForUser(
            userId,
            options("hello!!!", Language.ENGLISH, DictionaryFlavor.BILINGUAL, null, false, true)
        );

        Assertions.assertEquals(String.valueOf(word.getId()), result.getId());
        Assertions.assertEquals("hello-md", result.getMarkdown());
    }
}
