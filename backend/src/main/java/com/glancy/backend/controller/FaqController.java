package com.glancy.backend.controller;

import com.glancy.backend.dto.FaqRequest;
import com.glancy.backend.dto.FaqResponse;
import com.glancy.backend.service.FaqService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller exposing FAQ management endpoints used by admins
 * and clients. It allows creation and retrieval of FAQs.
 */
@RestController
@RequestMapping("/api/faqs")
@Slf4j
public class FaqController {

    private final FaqService faqService;

    public FaqController(FaqService faqService) {
        this.faqService = faqService;
    }

    /**
     * Create a new FAQ entry. This fulfils the requirement for
     * administrators to manage help documentation.
     */
    @PostMapping
    public ResponseEntity<FaqResponse> create(@Valid @RequestBody FaqRequest req) {
        log.info("Creating FAQ with question '{}'", req.getQuestion());
        FaqResponse resp = faqService.createFaq(req);
        log.info("Created FAQ {}", resp.getId());
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    /**
     * Retrieve all FAQ entries for display on the client side.
     */
    @GetMapping
    public ResponseEntity<List<FaqResponse>> list() {
        log.info("Retrieving all FAQs");
        List<FaqResponse> resp = faqService.getAllFaqs();
        log.info("Returning {} FAQs", resp.size());
        return ResponseEntity.ok(resp);
    }
}
