package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.config.SearchProperties;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.MembershipType;
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
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
    properties = {
        "search.limit.nonMember=2",
        "oss.access-key-id=test-access-key",
        "oss.access-key-secret=test-access-secret",
        "oss.verify-location=false",
    }
)
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
     * 测试目标：验证归一化后相同的词条不会因为大小写或空白差异重复保存。\
     * 前置条件：用户已创建并完成登录。\
     * 步骤：\
     *  1) 保存带有空白和大写的词条 " Hello ";\
     *  2) 使用小写无空白的 "hello" 再次保存。\
     * 断言：\
     *  - 第二次保存返回的记录 ID 与首次相同；\
     *  - 数据库中仅存在一条未删除的记录。\
     * 边界/异常：若命中逻辑缺陷导致新增记录或返回空对象则失败。
     */
    @Test
    void reusesExistingRecordWhenOnlyCaseOrWhitespaceDiffers() {
        User user = new User();
        user.setUsername("normalize");
        user.setPassword("p");
        user.setEmail("n@example.com");
        user.setPhone("46");
        userRepository.save(user);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        SearchRecordRequest noisy = new SearchRecordRequest();
        noisy.setTerm(" Hello ");
        noisy.setLanguage(Language.ENGLISH);

        SearchRecordResponse first = searchRecordService.saveRecord(user.getId(), noisy);

        SearchRecordRequest normalized = new SearchRecordRequest();
        normalized.setTerm("hello");
        normalized.setLanguage(Language.ENGLISH);

        SearchRecordResponse second = searchRecordService.saveRecord(user.getId(), normalized);

        assertEquals(first.id(), second.id(), "归一化后的查询应复用现有记录");
        List<SearchRecord> records = searchRecordRepository.findByUserIdAndDeletedFalse(user.getId());
        assertEquals(1, records.size(), "数据库中应仅保留一条未删除记录");
    }

    /**
     * 验证批量获取搜索记录时会一次性组装全部版本信息并确保最新版本优先呈现。
     */
    @Test
    void getRecordsLoadsVersionSummariesInBatch() {
        User user = new User();
        user.setUsername("batch");
        user.setPassword("p");
        user.setEmail("batch@example.com");
        user.setPhone("45");
        userRepository.save(user);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        SearchRecordRequest req1 = new SearchRecordRequest();
        req1.setTerm("alpha");
        req1.setLanguage(Language.ENGLISH);

        SearchRecordRequest req2 = new SearchRecordRequest();
        req2.setTerm("beta");
        req2.setLanguage(Language.ENGLISH);

        SearchRecordResponse first = searchRecordService.saveRecord(user.getId(), req1);
        SearchRecordResponse second = searchRecordService.saveRecord(user.getId(), req2);

        SearchRecord recordOne = searchRecordRepository.findById(first.id()).orElseThrow();
        SearchRecord recordTwo = searchRecordRepository.findById(second.id()).orElseThrow();

        persistVersion(recordOne, user, "gpt-3.5", 1, "alpha-v1");
        persistVersion(recordOne, user, "gpt-4", 2, "alpha-v2");
        persistVersion(recordTwo, user, "gpt-4", 1, "beta-v1");

        List<SearchRecordResponse> responses = searchRecordService.getRecords(user.getId());

        SearchRecordResponse alphaResponse = responses
            .stream()
            .filter(resp -> resp.id().equals(recordOne.getId()))
            .findFirst()
            .orElseThrow();
        assertEquals(2, alphaResponse.versions().size());
        assertNotNull(alphaResponse.latestVersion());
        assertEquals(2, alphaResponse.latestVersion().versionNumber());
        assertEquals(2, alphaResponse.versions().get(0).versionNumber());
        assertEquals(1, alphaResponse.versions().get(1).versionNumber());

        SearchRecordResponse betaResponse = responses
            .stream()
            .filter(resp -> resp.id().equals(recordTwo.getId()))
            .findFirst()
            .orElseThrow();
        assertEquals(1, betaResponse.versions().size());
        assertEquals(1, betaResponse.latestVersion().versionNumber());
    }

    /**
     * 测试目标：验证分页查询按照页码与条数返回固定规模的数据集并保持去重排序。
     * 前置条件：同一用户写入 25 条不同搜索记录，均带有登录态。
     * 步骤：
     *  1) 循环调用 saveRecord 创建 25 条记录；
     *  2) 分别以 page=0/1 size=10 拉取两页数据；
     * 断言：
     *  - 两页均返回 10 条记录且不重复；
     *  - 第二页最新项的创建时间不晚于第一页最旧项，确保倒序排序；
     * 边界/异常：
     *  - 如第二页不足 10 条则说明分页未按预期生效，应当失败。
     */
    @Test
    void getRecordsHonorsPagination() {
        User user = new User();
        user.setUsername("pager");
        user.setPassword("p");
        user.setEmail("pager@example.com");
        user.setPhone("46");
        userRepository.save(user);
        LocalDateTime now = LocalDateTime.now();
        user.setLastLoginAt(now);
        user.updateMembership(MembershipType.PRO, now.plusDays(1), now);
        userRepository.save(user);

        for (int i = 0; i < 25; i++) {
            SearchRecordRequest req = new SearchRecordRequest();
            req.setTerm("term-" + i);
            req.setLanguage(Language.ENGLISH);
            searchRecordService.saveRecord(user.getId(), req);
        }

        List<SearchRecordResponse> firstPage = searchRecordService.getRecords(user.getId(), 0, 10);
        List<SearchRecordResponse> secondPage = searchRecordService.getRecords(user.getId(), 1, 10);

        assertEquals(10, firstPage.size(), "第一页应返回 10 条记录");
        assertEquals(10, secondPage.size(), "第二页应返回 10 条记录");

        long distinctCount = Stream.concat(firstPage.stream(), secondPage.stream())
            .map(SearchRecordResponse::id)
            .distinct()
            .count();
        assertEquals(20, distinctCount, "前两页记录应互不重复");

        LocalDateTime firstPageOldest = firstPage.get(firstPage.size() - 1).createdAt();
        LocalDateTime secondPageNewest = secondPage.get(0).createdAt();
        assertTrue(
            secondPageNewest.isBefore(firstPageOldest) || secondPageNewest.isEqual(firstPageOldest),
            "第二页最新项的时间不应晚于第一页最旧项"
        );
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

    /**
     * 测试目标：验证模型返回规范词条后同步更新搜索记录中的展示词条。\
     * 前置条件：用户存在且已登录，初次保存的搜索记录词条为错误拼写。\
     * 步骤：\
     *  1) 保存词条 "recieve"；\
     *  2) 调用 synchronizeRecordTerm 传入模型纠正后的 "receive"；\
     * 断言：\
     *  - 搜索记录中的 term 被更新为规范词；\
     *  - 返回的响应同样反映最新词条。\
     * 边界/异常：\
     *  - 若返回 null 或仍为旧值则视为失败。
     */
    @Test
    void synchronizeRecordTermUpdatesHistory() {
        User user = new User();
        user.setUsername("spell");
        user.setPassword("p");
        user.setEmail("spell@example.com");
        user.setPhone("55");
        userRepository.save(user);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        SearchRecordRequest req = new SearchRecordRequest();
        req.setTerm("recieve");
        req.setLanguage(Language.ENGLISH);
        SearchRecordResponse response = searchRecordService.saveRecord(user.getId(), req);

        SearchRecordResponse synchronizedResponse = searchRecordService.synchronizeRecordTerm(
            user.getId(),
            response.id(),
            "receive"
        );

        SearchRecord updated = searchRecordRepository.findById(response.id()).orElseThrow();
        assertEquals("receive", updated.getTerm(), "数据库中的词条应为规范词");
        assertNotNull(synchronizedResponse, "同步后响应不应为空");
        assertEquals("receive", synchronizedResponse.term(), "返回结果应反映规范词条");
    }

    private void persistVersion(SearchRecord record, User user, String model, int versionNumber, String content) {
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
}
