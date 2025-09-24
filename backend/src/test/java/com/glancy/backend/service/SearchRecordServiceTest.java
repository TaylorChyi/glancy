package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.config.SearchProperties;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.SearchRecordRepository;
import com.glancy.backend.repository.SearchResultVersionRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = "search.limit.nonMember=2")
@Transactional
class SearchRecordServiceTest {

    @Autowired
    private SearchRecordService searchRecordService;

    @Autowired
    private SearchRecordRepository searchRecordRepository;

    @Autowired
    private SearchResultVersionRepository searchResultVersionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SearchProperties searchProperties;

    @BeforeAll
    static void loadEnv() {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String dbPassword = dotenv.get("DB_PASSWORD");
        if (dbPassword != null) {
            System.setProperty("DB_PASSWORD", dbPassword);
        }
    }

    @BeforeEach
    void setUp() {
        searchRecordRepository.deleteAll();
        userRepository.deleteAll();
    }

    /**
     * 测试 searchPropertiesBinding 接口
     */
    @Test
    void searchPropertiesBinding() {
        assertEquals(2, searchProperties.getLimit().getNonMember());
    }

    /**
     * 测试 testSaveListAndClear 接口
     */
    @Test
    void testSaveListAndClear() {
        User user = new User();
        user.setUsername("sruser");
        user.setPassword("p");
        user.setEmail("s@example.com");
        user.setPhone("41");
        userRepository.save(user);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm("hello");
        req.setLanguage(Language.ENGLISH);
        SearchRecordResponse saved = searchRecordService.saveRecord(user.getId(), req);
        assertNotNull(saved.id());

        List<SearchRecordResponse> list = searchRecordService.getRecords(user.getId());
        assertEquals(1, list.size());
        assertEquals("hello", list.get(0).term());
        assertTrue(list.get(0).versions().isEmpty());

        searchRecordService.clearRecords(user.getId());
        assertTrue(searchRecordService.getRecords(user.getId()).isEmpty());
    }

    /**
     * 测试 testSaveRecordWithoutLogin 接口
     */
    @Test
    void testSaveRecordWithoutLogin() {
        User user = new User();
        user.setUsername("nologin");
        user.setPassword("p");
        user.setEmail("n@example.com");
        user.setPhone("42");
        userRepository.save(user);

        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm("hi");
        req.setLanguage(Language.ENGLISH);

        Exception ex = assertThrows(InvalidRequestException.class, () ->
            searchRecordService.saveRecord(user.getId(), req)
        );
        assertEquals("用户未登录", ex.getMessage());
    }

    /**
     * 测试 testNonMemberLimitExceeded 接口
     */
    @Test
    void testNonMemberLimitExceeded() {
        User user = new User();
        user.setUsername("limit");
        user.setPassword("p");
        user.setEmail("l@example.com");
        user.setPhone("43");
        userRepository.save(user);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

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
        Exception ex = assertThrows(InvalidRequestException.class, () ->
            searchRecordService.saveRecord(user.getId(), req3)
        );
        assertEquals("非会员每天只能搜索2次", ex.getMessage());
    }

    /**
     * 测试 testDuplicateRecordNotSaved 接口
     */
    @Test
    void testDuplicateRecordNotSaved() {
        User user = new User();
        user.setUsername("dupe");
        user.setPassword("p");
        user.setEmail("d@example.com");
        user.setPhone("44");
        userRepository.save(user);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm("hello");
        req.setLanguage(Language.ENGLISH);

        SearchRecordResponse first = searchRecordService.saveRecord(user.getId(), req);
        SearchRecordResponse second = searchRecordService.saveRecord(user.getId(), req);

        assertEquals(first.id(), second.id());
        assertTrue(second.createdAt().isAfter(first.createdAt()));
        List<SearchRecordResponse> list = searchRecordService.getRecords(user.getId());
        assertEquals(1, list.size());
        assertEquals(second.createdAt(), list.get(0).createdAt());
    }

    /**
     * 验证删除搜索记录时版本数据同步软删除。
     */
    @Test
    void deleteRecordSoftDeletesVersions() {
        User user = new User();
        user.setUsername("deleter");
        user.setPassword("p");
        user.setEmail("del@example.com");
        user.setPhone("99");
        userRepository.save(user);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm("vanish");
        req.setLanguage(Language.ENGLISH);
        SearchRecordResponse recordResponse = searchRecordService.saveRecord(user.getId(), req);
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
        assertTrue(deletedRecord.getDeleted());
        SearchResultVersion deletedVersion = searchResultVersionRepository.findById(version.getId()).orElseThrow();
        assertTrue(deletedVersion.getDeleted());
    }
}
