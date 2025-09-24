package com.glancy.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

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
     * 构建多条搜索记录（含软删除记录），验证 Repository 查询仅关注未删除数据并能正确按照时间顺序、数量与存在性进行判定。
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
        SearchRecord r2 = TestEntityFactory.searchRecord(user, "term2", Language.ENGLISH, LocalDateTime.now());
        searchRecordRepository.save(r1);
        searchRecordRepository.save(r2);

        SearchRecord deletedRecord = TestEntityFactory.searchRecord(
            user,
            "term3",
            Language.ENGLISH,
            LocalDateTime.now().minusHours(2)
        );
        deletedRecord.setDeleted(true);
        searchRecordRepository.save(deletedRecord);

        List<SearchRecord> list = searchRecordRepository.findByUserIdAndDeletedFalseOrderByCreatedAtDesc(user.getId());
        assertEquals("term2", list.get(0).getTerm());

        long count = searchRecordRepository.countByUserIdAndDeletedFalseAndCreatedAtBetween(
            user.getId(),
            LocalDateTime.now().minusDays(2),
            LocalDateTime.now()
        );
        assertEquals(2, count);

        assertTrue(
            searchRecordRepository.existsByUserIdAndTermAndLanguageAndDeletedFalse(
                user.getId(),
                "term1",
                Language.ENGLISH
            )
        );

        SearchRecord r3 = TestEntityFactory.searchRecord(
            user,
            "term1",
            Language.ENGLISH,
            LocalDateTime.now().plusMinutes(1)
        );
        searchRecordRepository.save(r3);
        SearchRecord top = searchRecordRepository.findTopByUserIdAndTermAndLanguageAndDeletedFalseOrderByCreatedAtDesc(
            user.getId(),
            "term1",
            Language.ENGLISH
        );
        assertEquals(r3.getId(), top.getId());

        assertTrue(searchRecordRepository.findByIdAndUserIdAndDeletedFalse(r1.getId(), user.getId()).isPresent());
        assertTrue(searchRecordRepository.findByIdAndDeletedFalse(r2.getId()).isPresent());
        assertTrue(searchRecordRepository.findByIdAndDeletedFalse(deletedRecord.getId()).isEmpty());
    }
}
