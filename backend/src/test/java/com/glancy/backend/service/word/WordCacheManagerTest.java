package com.glancy.backend.service.word;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import com.glancy.backend.repository.WordRepository;
import com.glancy.backend.service.support.DictionaryTermNormalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WordCacheManagerTest {

    @Mock
    private WordRepository wordRepository;

    @Mock
    private DictionaryTermNormalizer termNormalizer;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private WordCacheManager wordCacheManager;

    @Test
    void saveWordWithUnmodifiableSourceKeepsMutableLists() {
        when(termNormalizer.normalize("requested")).thenReturn("normalized");
        when(wordRepository.findActiveByNormalizedTerm("normalized", Language.ENGLISH, DictionaryFlavor.BILINGUAL))
            .thenReturn(Optional.empty());
        when(wordRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        WordResponse response = new WordResponse();
        response.setTerm("term");
        response.setDefinitions(List.of("definition"));
        response.setVariations(List.of("variation"));
        response.setSynonyms(List.of("synonym"));
        response.setAntonyms(List.of("antonym"));
        response.setRelated(List.of("related"));
        response.setPhrases(List.of("phrase"));
        response.setMarkdown("markdown");

        Word saved = assertDoesNotThrow(
            () -> wordCacheManager.saveWord("requested", response, Language.ENGLISH, DictionaryFlavor.BILINGUAL)
        );

        assertEquals(List.of("definition"), saved.getDefinitions());
        assertEquals(List.of("variation"), saved.getVariations());
        assertEquals(List.of("synonym"), saved.getSynonyms());
        assertEquals(List.of("antonym"), saved.getAntonyms());
        assertEquals(List.of("related"), saved.getRelated());
        assertEquals(List.of("phrase"), saved.getPhrases());
        assertDoesNotThrow(() -> saved.getDefinitions().add("extra"));
        assertDoesNotThrow(() -> saved.getVariations().add("extra"));
        assertDoesNotThrow(() -> saved.getSynonyms().add("extra"));
        assertDoesNotThrow(() -> saved.getAntonyms().add("extra"));
        assertDoesNotThrow(() -> saved.getRelated().add("extra"));
        assertDoesNotThrow(() -> saved.getPhrases().add("extra"));
    }

    @Test
    void saveWordClearsListWhenSourceIsNull() {
        Word existing = new Word();
        existing.setId(42L);
        existing.setTerm("term");
        existing.setNormalizedTerm("normalized");
        existing.setLanguage(Language.ENGLISH);
        existing.setFlavor(DictionaryFlavor.BILINGUAL);
        existing.getDefinitions().add("old definition");
        existing.getVariations().add("old variation");
        existing.getSynonyms().add("old synonym");
        existing.getAntonyms().add("old antonym");
        existing.getRelated().add("old related");
        existing.getPhrases().add("old phrase");

        when(termNormalizer.normalize("requested")).thenReturn("normalized");
        when(wordRepository.findActiveByNormalizedTerm("normalized", Language.ENGLISH, DictionaryFlavor.BILINGUAL))
            .thenReturn(Optional.of(existing));
        when(wordRepository.save(existing)).thenReturn(existing);

        WordResponse response = new WordResponse();
        response.setTerm("term");

        Word saved = wordCacheManager.saveWord("requested", response, Language.ENGLISH, DictionaryFlavor.BILINGUAL);

        assertTrue(saved.getDefinitions().isEmpty());
        assertTrue(saved.getVariations().isEmpty());
        assertTrue(saved.getSynonyms().isEmpty());
        assertTrue(saved.getAntonyms().isEmpty());
        assertTrue(saved.getRelated().isEmpty());
        assertTrue(saved.getPhrases().isEmpty());
        assertDoesNotThrow(() -> saved.getDefinitions().add("extra"));
        assertDoesNotThrow(() -> saved.getVariations().add("extra"));
        assertDoesNotThrow(() -> saved.getSynonyms().add("extra"));
        assertDoesNotThrow(() -> saved.getAntonyms().add("extra"));
        assertDoesNotThrow(() -> saved.getRelated().add("extra"));
        assertDoesNotThrow(() -> saved.getPhrases().add("extra"));
    }

    @Test
    void saveWordReplacesExistingValuesWhenSourceHasElements() {
        Word existing = new Word();
        existing.setId(100L);
        existing.setTerm("term");
        existing.setNormalizedTerm("normalized");
        existing.setLanguage(Language.ENGLISH);
        existing.setFlavor(DictionaryFlavor.BILINGUAL);
        existing.getDefinitions().add("old definition");
        existing.getVariations().add("old variation");
        existing.getSynonyms().add("old synonym");
        existing.getAntonyms().add("old antonym");
        existing.getRelated().add("old related");
        existing.getPhrases().add("old phrase");

        when(termNormalizer.normalize("requested")).thenReturn("normalized");
        when(wordRepository.findActiveByNormalizedTerm("normalized", Language.ENGLISH, DictionaryFlavor.BILINGUAL))
            .thenReturn(Optional.of(existing));
        when(wordRepository.save(existing)).thenReturn(existing);

        WordResponse response = new WordResponse();
        response.setTerm("term");
        response.setDefinitions(new ArrayList<>(List.of("new definition", "second definition")));
        response.setVariations(new ArrayList<>(List.of("new variation")));
        response.setSynonyms(new ArrayList<>(List.of("new synonym")));
        response.setAntonyms(new ArrayList<>(List.of("new antonym")));
        response.setRelated(new ArrayList<>(List.of("new related")));
        response.setPhrases(new ArrayList<>(List.of("new phrase")));

        Word saved = wordCacheManager.saveWord("requested", response, Language.ENGLISH, DictionaryFlavor.BILINGUAL);

        assertEquals(List.of("new definition", "second definition"), saved.getDefinitions());
        assertEquals(List.of("new variation"), saved.getVariations());
        assertEquals(List.of("new synonym"), saved.getSynonyms());
        assertEquals(List.of("new antonym"), saved.getAntonyms());
        assertEquals(List.of("new related"), saved.getRelated());
        assertEquals(List.of("new phrase"), saved.getPhrases());
        assertDoesNotThrow(() -> saved.getDefinitions().add("extra"));
        assertDoesNotThrow(() -> saved.getVariations().add("extra"));
        assertDoesNotThrow(() -> saved.getSynonyms().add("extra"));
        assertDoesNotThrow(() -> saved.getAntonyms().add("extra"));
        assertDoesNotThrow(() -> saved.getRelated().add("extra"));
        assertDoesNotThrow(() -> saved.getPhrases().add("extra"));
    }
}

