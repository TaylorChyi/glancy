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
        List<String> models = modelService.getModelNames();
        return ResponseEntity.ok(models);
    }
}
