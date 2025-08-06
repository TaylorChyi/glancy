package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.FaqRequest;
import com.glancy.backend.dto.FaqResponse;
import com.glancy.backend.repository.FaqRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class FaqServiceTest {

    @Autowired
    private FaqService faqService;

    @Autowired
    private FaqRepository faqRepository;

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
        faqRepository.deleteAll();
    }

    /**
     * 测试 testCreateAndListFaqs 接口
     */
    @Test
    void testCreateAndListFaqs() {
        FaqRequest req = new FaqRequest();
        req.setQuestion("Q1");
        req.setAnswer("A1");
        FaqResponse resp = faqService.createFaq(req);
        assertNotNull(resp.getId());

        List<FaqResponse> list = faqService.getAllFaqs();
        assertEquals(1, list.size());
        assertEquals("Q1", list.get(0).getQuestion());
    }
}
