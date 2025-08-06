package com.glancy.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class WordRepositoryTest {

    @Autowired
    private WordRepository wordRepository;

    @Test
    void findByTermAndLanguageAndDeletedFalse() {
        Word word = TestEntityFactory.word("hello", Language.ENGLISH);
        wordRepository.save(word);

        Optional<Word> found = wordRepository.findByTermAndLanguageAndDeletedFalse("hello", Language.ENGLISH);
        assertTrue(found.isPresent());
        assertEquals("hello", found.get().getTerm());
    }
}
