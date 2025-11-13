package com.glancy.backend.service;

import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class SearchRecordServiceCreateTest extends AbstractSearchRecordServiceTest {

    @Test
    void searchPropertiesBinding() {
        Assertions.assertEquals(2, searchProperties.getLimit().getNonMember());
    }

    @Test
    void testSaveListAndClear() {
        User user = loginUser("sruser", "s@example.com");

        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm("hello");
        req.setLanguage(Language.ENGLISH);
        SearchRecordResponse saved = searchRecordService.saveRecord(user.getId(), req);
        Assertions.assertNotNull(saved.id());

        List<SearchRecordResponse> list = searchRecordService.getRecords(user.getId());
        Assertions.assertEquals(1, list.size());
        Assertions.assertEquals("hello", list.get(0).term());
        Assertions.assertTrue(list.get(0).versions().isEmpty());

        searchRecordService.clearRecords(user.getId());
        Assertions.assertTrue(searchRecordService.getRecords(user.getId()).isEmpty());
    }

    @Test
    void testSaveRecordWithoutLogin() {
        User user = persistUser("nologin", "n@example.com");

        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm("hi");
        req.setLanguage(Language.ENGLISH);

        Exception ex = Assertions.assertThrows(
                InvalidRequestException.class, () -> searchRecordService.saveRecord(user.getId(), req));
        Assertions.assertEquals("用户未登录", ex.getMessage());
    }

    @Test
    void testNonMemberLimitExceeded() {
        User user = loginUser("limit", "l@example.com");

        SearchRecordRequest req1 = new SearchRecordRequest();
        req1.setTerm("hi1");
        req1.setLanguage(Language.ENGLISH);
        SearchRecordRequest req2 = new SearchRecordRequest();
        req2.setTerm("hi2");
        req2.setLanguage(Language.ENGLISH);
        SearchRecordRequest req3 = new SearchRecordRequest();
        req3.setTerm("hi3");
        req3.setLanguage(Language.ENGLISH);

        searchRecordService.saveRecord(user.getId(), req1);
        searchRecordService.saveRecord(user.getId(), req2);
        Exception ex = Assertions.assertThrows(
                InvalidRequestException.class, () -> searchRecordService.saveRecord(user.getId(), req3));
        Assertions.assertEquals("非会员每天只能搜索2次", ex.getMessage());
    }

    @Test
    void testDuplicateRecordNotSaved() {
        User user = loginUser("dupe", "d@example.com");

        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm("hello");
        req.setLanguage(Language.ENGLISH);

        SearchRecordResponse first = searchRecordService.saveRecord(user.getId(), req);
        LocalDateTime beforeReuse =
                searchRecordRepository.findById(first.id()).orElseThrow().getUpdatedAt();
        SearchRecordResponse second = searchRecordService.saveRecord(user.getId(), req);

        Assertions.assertEquals(first.id(), second.id());
        SearchRecord refreshed = searchRecordRepository.findById(first.id()).orElseThrow();
        Assertions.assertTrue(refreshed.getUpdatedAt().isAfter(beforeReuse));
        List<SearchRecordResponse> list = searchRecordService.getRecords(user.getId());
        Assertions.assertEquals(1, list.size());
        Assertions.assertEquals(second.id(), list.get(0).id());
    }

    @Test
    void reusedRecordRefreshesUpdatedAtAndMovesToTop() throws InterruptedException {
        User user = loginUser("touch", "touch@example.com");

        SearchRecordResponse alphaRecord = searchRecordService.saveRecord(user.getId(), request("alpha"));
        searchRecordService.saveRecord(user.getId(), request("beta"));

        SearchRecord storedAlpha =
                searchRecordRepository.findById(alphaRecord.id()).orElseThrow();
        LocalDateTime beforeReuse = storedAlpha.getUpdatedAt();

        Thread.sleep(5L);

        SearchRecordResponse reused = searchRecordService.saveRecord(user.getId(), request("alpha"));

        Assertions.assertEquals(alphaRecord.id(), reused.id(), "重复查询应复用同一条记录");

        SearchRecord refreshedAlpha =
                searchRecordRepository.findById(alphaRecord.id()).orElseThrow();
        Assertions.assertTrue(refreshedAlpha.getUpdatedAt().isAfter(beforeReuse), "复用后的记录应刷新 updatedAt 以反映最近访问");

        List<SearchRecordResponse> history = searchRecordService.getRecords(user.getId());
        Assertions.assertEquals(2, history.size(), "历史记录应维持原有条数");
        Assertions.assertEquals("alpha", history.get(0).term(), "刷新后应将复用词条排在首位");
    }

    @Test
    void reusesExistingRecordWhenOnlyCaseOrWhitespaceDiffers() {
        User user = loginUser("normalize", "n@example.com");

        SearchRecordRequest noisy = new SearchRecordRequest();
        noisy.setTerm(" Hello ");
        noisy.setLanguage(Language.ENGLISH);

        SearchRecordResponse first = searchRecordService.saveRecord(user.getId(), request(" Hello "));
        SearchRecordResponse second = searchRecordService.saveRecord(user.getId(), request("hello"));

        Assertions.assertEquals(first.id(), second.id(), "归一化后的查询应复用现有记录");
        List<SearchRecord> records = searchRecordRepository.findByUserIdAndDeletedFalse(user.getId());
        Assertions.assertEquals(1, records.size(), "数据库中应仅保留一条未删除记录");
    }

    @Test
    void reusesExistingRecordWhenWhitespaceCollapsedByNormalizer() {
        User user = loginUser("collapse", "collapse@example.com");

        SearchRecordRequest spaced = new SearchRecordRequest();
        spaced.setTerm("foo   bar");
        spaced.setLanguage(Language.ENGLISH);

        SearchRecordResponse first = searchRecordService.saveRecord(user.getId(), request("foo   bar"));
        SearchRecordResponse second = searchRecordService.saveRecord(user.getId(), request("foo bar"));

        Assertions.assertEquals(first.id(), second.id(), "多余空白应被归一化并复用已有记录");
        List<SearchRecord> records = searchRecordRepository.findByUserIdAndDeletedFalse(user.getId());
        Assertions.assertEquals(1, records.size(), "归一化后仍应只有一条记录");
    }

    @Test
    void synchronizeRecordTermUpdatesHistory() {
        User user = loginUser("spell", "spell@example.com");

        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm("recieve");
        req.setLanguage(Language.ENGLISH);
        SearchRecordResponse response = searchRecordService.saveRecord(user.getId(), req);

        SearchRecordResponse synchronizedResponse =
                searchRecordService.synchronizeRecordTerm(user.getId(), response.id(), "receive");

        SearchRecord updated = searchRecordRepository.findById(response.id()).orElseThrow();
        Assertions.assertEquals("receive", updated.getTerm(), "数据库中的词条应为规范词");
        Assertions.assertNotNull(synchronizedResponse, "同步后响应不应为空");
        Assertions.assertEquals("receive", synchronizedResponse.term(), "返回结果应反映规范词条");
    }

    private User loginUser(String username, String email) {
        User user = persistUser(username, email);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        return user;
    }

    private SearchRecordRequest request(String term) {
        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm(term);
        req.setLanguage(Language.ENGLISH);
        return req;
    }
}
