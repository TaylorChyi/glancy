package com.glancy.backend.service;

import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class SearchRecordServicePaginationTest extends AbstractSearchRecordServiceTest {

  @Test
  void getRecordsLoadsVersionSummariesInBatch() {
    User user = loginUser("batch", "batch@example.com");

    SearchRecordResponse first = searchRecordService.saveRecord(user.getId(), request("alpha"));
    SearchRecordResponse second = searchRecordService.saveRecord(user.getId(), request("beta"));

    SearchRecord recordOne = searchRecordRepository.findById(first.id()).orElseThrow();
    SearchRecord recordTwo = searchRecordRepository.findById(second.id()).orElseThrow();

    persistVersion(recordOne, user, "gpt-3.5", 1, "alpha-v1");
    persistVersion(recordOne, user, "gpt-4", 2, "alpha-v2");
    persistVersion(recordTwo, user, "gpt-4", 1, "beta-v1");

    List<SearchRecordResponse> responses = searchRecordService.getRecords(user.getId());

    assertAlphaResponse(responseFor(responses, recordOne));
    assertBetaResponse(responseFor(responses, recordTwo));
  }

  @Test
  void getRecordsHonorsPagination() {
    User user = loginUser("pager", "pager@example.com");
    LocalDateTime now = LocalDateTime.now();
    user.updateMembership(MembershipType.PRO, now.plusDays(1), now);
    userRepository.save(user);

    for (int i = 0; i < 25; i++) {
      searchRecordService.saveRecord(user.getId(), request("term-" + i));
    }

    List<SearchRecordResponse> firstPage = searchRecordService.getRecords(user.getId(), 0, 10);
    List<SearchRecordResponse> secondPage = searchRecordService.getRecords(user.getId(), 1, 10);

    assertPaginationOrdering(firstPage, secondPage);
  }

  private SearchRecordRequest request(String term) {
    SearchRecordRequest req = new SearchRecordRequest();
    req.setTerm(term);
    req.setLanguage(Language.ENGLISH);
    return req;
  }

  private void persistVersion(
      SearchRecord record, User user, String model, int versionNumber, String content) {
    SearchResultVersion version = new SearchResultVersion();
    version.setSearchRecord(record);
    version.setUser(user);
    version.setTerm(record.getTerm());
    version.setLanguage(record.getLanguage());
    version.setFlavor(Optional.ofNullable(record.getFlavor()).orElse(DictionaryFlavor.BILINGUAL));
    version.setModel(model);
    version.setVersionNumber(versionNumber);
    version.setContent(content);
    version.setPreview(content);
    searchResultVersionRepository.save(version);
  }

  private SearchRecordResponse responseFor(
      List<SearchRecordResponse> responses, SearchRecord record) {
    return responses.stream()
        .filter(resp -> resp.id().equals(record.getId()))
        .findFirst()
        .orElseThrow();
  }

  private void assertAlphaResponse(SearchRecordResponse response) {
    Assertions.assertEquals(2, response.versions().size());
    Assertions.assertNotNull(response.latestVersion());
    Assertions.assertEquals(2, response.latestVersion().versionNumber());
    Assertions.assertEquals(2, response.versions().get(0).versionNumber());
    Assertions.assertEquals(1, response.versions().get(1).versionNumber());
  }

  private void assertBetaResponse(SearchRecordResponse response) {
    Assertions.assertEquals(1, response.versions().size());
    Assertions.assertEquals(1, response.latestVersion().versionNumber());
  }

  private void assertPaginationOrdering(
      List<SearchRecordResponse> firstPage, List<SearchRecordResponse> secondPage) {
    Assertions.assertEquals(10, firstPage.size(), "第一页应返回 10 条记录");
    Assertions.assertEquals(10, secondPage.size(), "第二页应返回 10 条记录");

    long distinctCount =
        Stream.concat(firstPage.stream(), secondPage.stream())
            .map(SearchRecordResponse::id)
            .distinct()
            .count();
    Assertions.assertEquals(20, distinctCount, "前两页记录应互不重复");

    LocalDateTime firstPageOldest = firstPage.get(firstPage.size() - 1).createdAt();
    LocalDateTime secondPageNewest = secondPage.get(0).createdAt();
    Assertions.assertTrue(
        secondPageNewest.isBefore(firstPageOldest) || secondPageNewest.isEqual(firstPageOldest),
        "第二页最新项的时间不应晚于第一页最旧项");
  }

  private User loginUser(String username, String email) {
    User user = persistUser(username, email);
    user.setLastLoginAt(LocalDateTime.now());
    userRepository.save(user);
    return user;
  }
}
