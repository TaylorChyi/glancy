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

        List<SearchRecord> list = searchRecordRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        assertEquals("term2", list.get(0).getTerm());

        long count = searchRecordRepository.countByUserIdAndCreatedAtBetween(
            user.getId(),
            LocalDateTime.now().minusDays(2),
            LocalDateTime.now()
        );
        assertEquals(2, count);

        assertTrue(searchRecordRepository.existsByUserIdAndTermAndLanguage(user.getId(), "term1", Language.ENGLISH));

        SearchRecord r3 = TestEntityFactory.searchRecord(
            user,
            "term1",
            Language.ENGLISH,
            LocalDateTime.now().plusMinutes(1)
        );
        searchRecordRepository.save(r3);
        SearchRecord top = searchRecordRepository.findTopByUserIdAndTermAndLanguageOrderByCreatedAtDesc(
            user.getId(),
            "term1",
            Language.ENGLISH
        );
        assertEquals(r3.getId(), top.getId());

        assertTrue(searchRecordRepository.findByIdAndUserId(r1.getId(), user.getId()).isPresent());
    }
}
