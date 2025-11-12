package com.glancy.backend.service;

import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class SearchRecordServiceDeleteTest extends AbstractSearchRecordServiceTest {

  @Test
  void deleteRecordSoftDeletesVersions() {
    User user = loginUser("deleter", "del@example.com");

    SearchRecordResponse recordResponse =
        searchRecordService.saveRecord(user.getId(), request("vanish"));
    SearchRecord record = searchRecordRepository.findById(recordResponse.id()).orElseThrow();

    SearchResultVersion version = new SearchResultVersion();
    version.setSearchRecord(record);
    version.setUser(user);
    version.setTerm("vanish");
    version.setLanguage(Language.ENGLISH);
    version.setModel("test-model");
    version.setVersionNumber(1);
    version.setContent("content");
    version.setPreview("cont");
    searchResultVersionRepository.save(version);

    searchRecordService.deleteRecord(user.getId(), recordResponse.id());

    SearchRecord deletedRecord = searchRecordRepository.findById(recordResponse.id()).orElseThrow();
    Assertions.assertTrue(deletedRecord.getDeleted());
    SearchResultVersion deletedVersion =
        searchResultVersionRepository.findById(version.getId()).orElseThrow();
    Assertions.assertTrue(deletedVersion.getDeleted());
  }

  private SearchRecordRequest request(String term) {
    SearchRecordRequest req = new SearchRecordRequest();
    req.setTerm(term);
    req.setLanguage(Language.ENGLISH);
    return req;
  }

  private User loginUser(String username, String email) {
    User user = persistUser(username, email);
    user.setLastLoginAt(LocalDateTime.now());
    userRepository.save(user);
    return user;
  }
}
