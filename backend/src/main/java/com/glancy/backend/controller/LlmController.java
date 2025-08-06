package com.glancy.backend.controller;

import com.glancy.backend.service.LlmModelService;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Provides meta information about available LLM models.
 */
@Slf4j
@RestController
@RequestMapping("/api/llm")
public class LlmController {

    private final LlmModelService modelService;

    public LlmController(LlmModelService modelService) {
        this.modelService = modelService;
    }

    @GetMapping("/models")
    public ResponseEntity<List<String>> getModels() {
        log.info("Received request for available LLM models");
        List<String> models = modelService.getModelNames();
        log.info("Returning {} models: {}", models.size(), models);
        return ResponseEntity.ok(models);
    }
}
