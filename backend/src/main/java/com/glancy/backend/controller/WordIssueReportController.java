package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.WordIssueReportRequest;
import com.glancy.backend.dto.WordIssueReportResponse;
import com.glancy.backend.service.WordIssueReportService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/word-reports")
@Slf4j
public class WordIssueReportController {

    private final WordIssueReportService wordIssueReportService;

    public WordIssueReportController(WordIssueReportService wordIssueReportService) {
        this.wordIssueReportService = wordIssueReportService;
    }

    @PostMapping
    public ResponseEntity<WordIssueReportResponse> create(
            @AuthenticatedUser Long userId, @Valid @RequestBody WordIssueReportRequest request) {
        log.info("[WordIssueReport] user {} submitting report for term '{}'", userId, request.term());
        WordIssueReportResponse response = wordIssueReportService.registerReport(userId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
