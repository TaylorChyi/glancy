package com.glancy.backend.repository;

import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository caching words fetched from external dictionary services.
 */
@Repository
public interface WordRepository extends JpaRepository<Word, Long> {
    Optional<Word> findByTermAndLanguageAndDeletedFalse(String term, Language language);
}
