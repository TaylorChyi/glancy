package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.GomemoPlanResponse;
import com.glancy.backend.dto.GomemoProgressRequest;
import com.glancy.backend.dto.GomemoProgressSnapshotView;
import com.glancy.backend.dto.GomemoReviewResponse;
import com.glancy.backend.service.gomemo.GomemoService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints exposing Gomemo plan, progress and review capabilities.
 */
@RestController
@RequestMapping("/api/gomemo")
@Slf4j
public class GomemoController {

    private final GomemoService gomemoService;

    public GomemoController(GomemoService gomemoService) {
        this.gomemoService = gomemoService;
    }

    @GetMapping("/plan")
    public GomemoPlanResponse fetchPlan(@AuthenticatedUser Long userId) {
        log.info("gomemo.fetchPlan userId={}", userId);
        return gomemoService.preparePlan(userId);
    }

    @PostMapping("/sessions/{sessionId}/progress")
    public GomemoProgressSnapshotView recordProgress(
        @AuthenticatedUser Long userId,
        @PathVariable Long sessionId,
        @Valid @RequestBody GomemoProgressRequest request
    ) {
        log.info(
            "gomemo.recordProgress userId={} sessionId={} term={} mode={} attempts={} successes={}",
            userId,
            sessionId,
            request.term(),
            request.mode(),
            request.attempts(),
            request.successes()
        );
        return gomemoService.recordProgress(userId, sessionId, request);
    }

    @PostMapping("/sessions/{sessionId}/review")
    public GomemoReviewResponse completeSession(@AuthenticatedUser Long userId, @PathVariable Long sessionId) {
        log.info("gomemo.finalizeSession userId={} sessionId={}", userId, sessionId);
        return gomemoService.finalizeSession(userId, sessionId);
    }
}
