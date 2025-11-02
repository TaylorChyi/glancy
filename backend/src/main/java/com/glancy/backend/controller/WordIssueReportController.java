package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.word.WordIssueReportRequest;
import com.glancy.backend.dto.word.WordIssueReportResponse;
import com.glancy.backend.service.WordIssueReportService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 背景：
 *  - 前端举报表单需要一个受保护的接口提交数据。
 * 目的：
 *  - 提供 REST 入口统一承载身份验证、参数校验与服务调用，保持控制层纯粹。
 * 关键决策与取舍：
 *  - 控制器仅负责编排日志与响应包装，具体逻辑下沉到服务层；
 *  - 记录结构化日志，便于后续溯源与审计。
 */
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
        @AuthenticatedUser Long userId,
        @Valid @RequestBody WordIssueReportRequest request
    ) {
        log.info("[WordIssueReport] user {} submitting report for term '{}'", userId, request.term());
        WordIssueReportResponse response = wordIssueReportService.registerReport(userId, request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
