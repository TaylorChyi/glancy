package com.glancy.backend.service;

import com.glancy.backend.dto.FaqRequest;
import com.glancy.backend.dto.FaqResponse;
import com.glancy.backend.entity.Faq;
import com.glancy.backend.mapper.FaqMapper;
import com.glancy.backend.repository.FaqRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic for FAQ management. Allows admins to create and retrieve frequently asked
 * questions.
 */
@Slf4j
@Service
public class FaqService {

  private final FaqRepository faqRepository;
  private final FaqMapper faqMapper;

  public FaqService(FaqRepository faqRepository, FaqMapper faqMapper) {
    this.faqRepository = faqRepository;
    this.faqMapper = faqMapper;
  }

  /** Persist a new FAQ entry. */
  @Transactional
  public FaqResponse createFaq(FaqRequest request) {
    log.info("Creating FAQ: {}", request.getQuestion());
    Faq faq = new Faq();
    faq.setQuestion(request.getQuestion());
    faq.setAnswer(request.getAnswer());
    Faq saved = faqRepository.save(faq);
    return faqMapper.toResponse(saved);
  }

  /** Retrieve all stored FAQ entries. */
  @Transactional(readOnly = true)
  public List<FaqResponse> getAllFaqs() {
    log.info("Retrieving all FAQs");
    return faqRepository.findAll().stream().map(faqMapper::toResponse).collect(Collectors.toList());
  }
}
