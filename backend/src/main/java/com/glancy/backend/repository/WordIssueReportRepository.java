package com.glancy.backend.repository;

import com.glancy.backend.entity.WordIssueReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 背景：
 *  - 举报数据需要持久化存储并支持后续查询统计。
 * 目的：
 *  - 暴露 JpaRepository 能力，为服务层提供基础的新增与检索操作。
 * 关键决策与取舍：
 *  - 暂不扩展自定义查询，保持仓储层纯粹，复杂统计交由后续专用查询对象实现。
 */
@Repository
public interface WordIssueReportRepository extends JpaRepository<WordIssueReport, Long> {}
