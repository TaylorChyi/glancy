package com.glancy.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.entity.Faq;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class FaqRepositoryTest {

  @Autowired private FaqRepository faqRepository;

  @Test
  void saveAndRetrieve() {
    Faq faq = TestEntityFactory.faq("q1");
    faqRepository.save(faq);

    Optional<Faq> found = faqRepository.findById(faq.getId());
    assertTrue(found.isPresent());
    assertEquals("q1", found.get().getQuestion());
  }
}
