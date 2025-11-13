package com.glancy.backend.repository;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class SearchRecordRepositoryTest {

  @Autowired private SearchRecordRepository searchRecordRepository;

  @Autowired private UserRepository userRepository;

  @Test
  void ordersActiveRecordsByUpdatedAt() {
    SearchRecordFixture fixture = seedRecords();
    List<SearchRecord> list =
        searchRecordRepository.findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(
            fixture.user.getId());
    Assertions.assertEquals("term-latest", list.get(0).getTerm());
  }

  @Test
  void countsTodayRecords() {
    SearchRecordFixture fixture = seedRecords();
    long count =
        searchRecordRepository.countByUserIdAndDeletedFalseAndCreatedAtBetween(
            fixture.user.getId(), LocalDateTime.now().minusDays(2), LocalDateTime.now());
    Assertions.assertEquals(2, count);
  }

  @Test
  void findsLatestRecordForTerm() {
    SearchRecordFixture fixture = seedRecords();
    SearchRecord top =
        searchRecordRepository
            .findTopByUserIdAndTermAndLanguageAndFlavorAndDeletedFalseOrderByUpdatedAtDesc(
                fixture.user.getId(), "term1", Language.ENGLISH, DictionaryFlavor.BILINGUAL);
    Assertions.assertEquals(fixture.latestTerm1.getId(), top.getId());
  }

  @Test
  void excludesSoftDeletedRecords() {
    SearchRecordFixture fixture = seedRecords();
    Assertions.assertTrue(
        searchRecordRepository.findByIdAndDeletedFalse(fixture.activeTerm1.getId()).isPresent());
    Assertions.assertTrue(
        searchRecordRepository.findByIdAndDeletedFalse(fixture.activeTerm2.getId()).isPresent());
    Assertions.assertTrue(
        searchRecordRepository.findByIdAndDeletedFalse(fixture.deleted.getId()).isEmpty());
  }

  private SearchRecordFixture seedRecords() {
    User user = userRepository.save(TestEntityFactory.user(10));
    LocalDateTime now = LocalDateTime.now();
    SearchRecord term1 = persistRecord(user, "term1", now.minusDays(3), false);
    SearchRecord term2 = persistRecord(user, "term-latest", now, false);
    SearchRecord deleted = persistRecord(user, "term3", now.minusHours(2), true);
    SearchRecord latestTerm1 = persistRecord(user, "term1", now.minusDays(1), false);
    return new SearchRecordFixture(user, term1, term2, deleted, latestTerm1);
  }

  private SearchRecord persistRecord(
      User user, String term, LocalDateTime createdAt, boolean deleted) {
    SearchRecord record = TestEntityFactory.searchRecord(user, term, Language.ENGLISH, createdAt);
    record.setDeleted(deleted);
    record.setUpdatedAt(createdAt);
    return searchRecordRepository.save(record);
  }

  private record SearchRecordFixture(
      User user,
      SearchRecord activeTerm1,
      SearchRecord activeTerm2,
      SearchRecord deleted,
      SearchRecord latestTerm1) {}
}
