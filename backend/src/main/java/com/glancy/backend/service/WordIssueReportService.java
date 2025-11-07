package com.glancy.backend.service;

import com.glancy.backend.dto.WordIssueReportRequest;
import com.glancy.backend.dto.WordIssueReportResponse;
import com.glancy.backend.entity.WordIssueReport;
import com.glancy.backend.repository.WordIssueReportRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;


@Service
@Slf4j
public class WordIssueReportService {

    private final WordIssueReportRepository repository;

    public WordIssueReportService(WordIssueReportRepository repository) {
        this.repository = repository;
    }

    /**
     * 意图：将举报请求转换为持久化实体并保存，返回确认信息。
     * 输入：用户标识 userId、举报请求体 request。
     * 输出：持久化后的响应对象，包含数据库主键与创建时间。
     * 流程：
     *  1) 构造实体并标准化可变字段；
     *  2) 写入仓储；
     *  3) 生成响应记录用于返回给调用方。
     * 错误处理：依赖 Spring 事务回滚；若写入失败会抛出运行时异常。
     * 复杂度：O(1) 写入。
     */
    @Transactional
    public WordIssueReportResponse registerReport(Long userId, WordIssueReportRequest request) {
        WordIssueReport entity = new WordIssueReport();
        String term = request.term() == null ? "" : request.term().trim();
        entity.setTerm(term);
        entity.setLanguage(request.language());
        entity.setFlavor(request.flavor());
        entity.setCategory(request.category());
        entity.setDescription(normalizeDescription(request.description()));
        entity.setSourceUrl(normalizeSourceUrl(request.sourceUrl()));
        entity.setUserId(userId);

        WordIssueReport saved = repository.save(entity);
        log.info(
            "[WordIssueReport] recorded issue for term '{}' user {} category {}",
            saved.getTerm(),
            userId,
            saved.getCategory()
        );

        return new WordIssueReportResponse(
            saved.getId(),
            saved.getTerm(),
            saved.getLanguage(),
            saved.getFlavor(),
            saved.getCategory(),
            saved.getDescription(),
            saved.getSourceUrl(),
            saved.getCreatedAt()
        );
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String trimmed = description.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSourceUrl(String sourceUrl) {
        if (sourceUrl == null) {
            return null;
        }
        String trimmed = sourceUrl.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
