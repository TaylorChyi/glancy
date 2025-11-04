package com.glancy.backend.service.word;

import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.service.SearchRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - 搜索记录的创建与纠正逻辑在不同路径中重复，异常处理不一致。\
 * 目的：
 *  - 集中封装搜索记录生命周期操作，确保同步与流式流程使用统一的最佳实践。\
 * 关键决策与取舍：
 *  - 维持与 `SearchRecordService` 的一对一映射，避免引入额外状态；\
 *  - 对于同步流程，失败即抛出异常；流式流程可在策略中自行捕获。\
 * 影响范围：
 *  - 被查词策略调用以创建记录或同步标准词条。\
 * 演进与TODO：
 *  - 后续可在此处增加重试或熔断策略，以提升可靠性。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SearchRecordCoordinator {

    private final SearchRecordService searchRecordService;

    public SearchRecordResponse createRecord(WordQueryContext context) {
        if (!context.captureHistory()) {
            return null;
        }
        SearchRecordRequest request = new SearchRecordRequest();
        request.setTerm(context.rawTerm());
        request.setLanguage(context.language());
        request.setFlavor(context.flavor());
        return searchRecordService.saveRecord(context.userId(), request);
    }

    public void synchronizeRecordTermQuietly(Long userId, Long recordId, String canonicalTerm) {
        if (recordId == null || canonicalTerm == null || canonicalTerm.isBlank()) {
            return;
        }
        try {
            searchRecordService.synchronizeRecordTerm(userId, recordId, canonicalTerm);
        } catch (Exception ex) {
            log.warn(
                "Failed to synchronize search record {} for user {} with canonical term '{}': {}",
                recordId,
                userId,
                canonicalTerm,
                ex.getMessage(),
                ex
            );
        }
    }
}
