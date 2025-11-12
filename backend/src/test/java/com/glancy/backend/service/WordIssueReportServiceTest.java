package com.glancy.backend.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.glancy.backend.dto.WordIssueReportRequest;
import com.glancy.backend.dto.WordIssueReportResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.WordIssueCategory;
import com.glancy.backend.repository.WordIssueReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class WordIssueReportServiceTest {

  @Autowired private WordIssueReportService service;

  @Autowired private WordIssueReportRepository repository;

  @BeforeEach
  void clean() {
    repository.deleteAll();
  }

  /**
   * 测试目标：验证 registerReport 会持久化举报并返回包含主键与裁剪后的字段。 前置条件：构造必填字段齐全的请求体，描述带有首尾空格。 步骤： 1) 调用
   * registerReport; 2) 读取数据库中唯一一条记录。 断言： - 响应 ID 不为空； - 描述被裁剪； - 仓储记录数量为 1。 边界/异常： - 描述为空字符串时应被转换为
   * null（此用例不覆盖）。
   */
  @Test
  void registerReport_persistsEntity() {
    WordIssueReportRequest request =
        new WordIssueReportRequest(
            "hello",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            WordIssueCategory.INCORRECT_MEANING,
            "  wrong definition  ",
            "https://example.com");

    WordIssueReportResponse response = service.registerReport(7L, request);

    assertThat(response.id()).isNotNull();
    assertThat(response.description()).isEqualTo("wrong definition");
    assertThat(repository.count()).isEqualTo(1);
  }
}
