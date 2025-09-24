package com.glancy.backend.service.gomemo;

import com.glancy.backend.dto.GomemoPlanResponse;
import com.glancy.backend.dto.GomemoProgressRequest;
import com.glancy.backend.dto.GomemoProgressSnapshotView;
import com.glancy.backend.dto.GomemoReviewResponse;

/**
 * Public contract for Gomemo orchestration.
 */
public interface GomemoService {
    GomemoPlanResponse preparePlan(Long userId);

    GomemoProgressSnapshotView recordProgress(Long userId, Long sessionId, GomemoProgressRequest request);

    GomemoReviewResponse finalizeSession(Long userId, Long sessionId);
}
