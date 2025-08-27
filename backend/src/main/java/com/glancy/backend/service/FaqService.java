package com.glancy.backend.service;

import com.glancy.backend.dto.FaqRequest;
import com.glancy.backend.dto.FaqResponse;
import com.glancy.backend.entity.Faq;
import com.glancy.backend.mapper.FaqMapper;
import com.glancy.backend.repository.FaqRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic for FAQ management. Allows admins to create and retrieve frequently asked
 * questions.
 */
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
    Faq faq = new Faq();
    faq.setQuestion(request.getQuestion());
    faq.setAnswer(request.getAnswer());
    Faq saved = faqRepository.save(faq);
    return faqMapper.toResponse(saved);
  }

  /** Retrieve all stored FAQ entries. */
  @Transactional(readOnly = true)
  public List<FaqResponse> getAllFaqs() {
    return faqRepository.findAll().stream().map(faqMapper::toResponse).collect(Collectors.toList());
  }
}
