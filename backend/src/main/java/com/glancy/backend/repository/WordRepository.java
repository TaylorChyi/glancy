package com.glancy.backend.repository;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** Repository caching words fetched from external dictionary services. */
@Repository
public interface WordRepository extends JpaRepository<Word, Long> {
  Optional<Word> findByTermAndLanguageAndFlavorAndDeletedFalse(
      String term, Language language, DictionaryFlavor flavor);

  @Query(
      "SELECT w FROM Word w "
          + "WHERE w.deleted = false "
          + "AND w.language = :language "
          + "AND w.flavor = :flavor "
          + "AND (w.normalizedTerm = :normalizedTerm "
          + "OR (w.normalizedTerm IS NULL AND LOWER(TRIM(w.term)) = :normalizedTerm))")
  Optional<Word> findActiveByNormalizedTerm(
      @Param("normalizedTerm") String normalizedTerm,
      @Param("language") Language language,
      @Param("flavor") DictionaryFlavor flavor);
}
