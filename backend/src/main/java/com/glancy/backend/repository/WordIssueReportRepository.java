package com.glancy.backend.repository;

import com.glancy.backend.entity.WordIssueReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface WordIssueReportRepository extends JpaRepository<WordIssueReport, Long> {}
