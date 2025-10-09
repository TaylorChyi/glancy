package com.glancy.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class SearchRecordRepositoryTest {

    @Autowired
    private SearchRecordRepository searchRecordRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * 测试目标：构建含软删除的数据集，验证未删除记录按更新时间倒序返回且关联查询契约成立。
     * 前置条件：预先持久化 3 条搜索记录，其中一条标记删除。
     * 步骤：
     *  1) 查询全部未删除记录并检查排序；
     *  2) 统计今日新增数量并断言；
     *  3) 验证存在性与最新记录获取接口；
     *  4) 检查按用户与删除标记过滤的查询。
     * 断言：
     *  - 最新记录位于首位；
     *  - 统计结果为 2；
     *  - findTop 返回最新记录；
     *  - 软删除记录不会被常规查询返回。
     * 边界/异常：
     *  - 验证软删除记录查询为空，确保 deleted 标记生效。
     */
    @Test
    void searchRecordQueries() {
        User user = userRepository.save(TestEntityFactory.user(10));
        SearchRecord r1 = TestEntityFactory.searchRecord(
            user,
            "term1",
            Language.ENGLISH,
            LocalDateTime.now().minusDays(1)
        );
        r1.setUpdatedAt(LocalDateTime.now().minusDays(1));
        SearchRecord r2 = TestEntityFactory.searchRecord(user, "term2", Language.ENGLISH, LocalDateTime.now());
        r2.setUpdatedAt(LocalDateTime.now());
        searchRecordRepository.save(r1);
        searchRecordRepository.save(r2);

        SearchRecord deletedRecord = TestEntityFactory.searchRecord(
            user,
            "term3",
            Language.ENGLISH,
            LocalDateTime.now().minusHours(2)
        );
        deletedRecord.setDeleted(true);
        deletedRecord.setUpdatedAt(LocalDateTime.now().minusHours(2));
        searchRecordRepository.save(deletedRecord);

        List<SearchRecord> list = searchRecordRepository.findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(user.getId());
        assertEquals("term2", list.get(0).getTerm());

        long count = searchRecordRepository.countByUserIdAndDeletedFalseAndCreatedAtBetween(
            user.getId(),
            LocalDateTime.now().minusDays(2),
            LocalDateTime.now()
        );
        assertEquals(2, count);

        assertTrue(
            searchRecordRepository.existsByUserIdAndTermAndLanguageAndFlavorAndDeletedFalse(
                user.getId(),
                "term1",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL
            )
        );

        SearchRecord r3 = TestEntityFactory.searchRecord(
            user,
            "term1",
            Language.ENGLISH,
            LocalDateTime.now().plusMinutes(1)
        );
        r3.setUpdatedAt(LocalDateTime.now().plusMinutes(1));
        searchRecordRepository.save(r3);
        SearchRecord top =
            searchRecordRepository.findTopByUserIdAndTermAndLanguageAndFlavorAndDeletedFalseOrderByUpdatedAtDesc(
                user.getId(),
                "term1",
                Language.ENGLISH,
                DictionaryFlavor.BILINGUAL
            );
        assertEquals(r3.getId(), top.getId());

        assertTrue(searchRecordRepository.findByIdAndUserIdAndDeletedFalse(r1.getId(), user.getId()).isPresent());
        assertTrue(searchRecordRepository.findByIdAndDeletedFalse(r2.getId()).isPresent());
        assertTrue(searchRecordRepository.findByIdAndDeletedFalse(deletedRecord.getId()).isEmpty());
    }
}
