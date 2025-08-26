package com.glancy.backend.config;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoMoreInteractions;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

/**
 * 测试逻辑：验证迁移策略会在执行迁移前先修复 Flyway 的历史记录。
 */
class FlywayConfigTest {

  @Test
  void repairAndMigrateStrategyRepairsBeforeMigrating() {
    Flyway flyway = mock(Flyway.class);
    InOrder order = inOrder(flyway);

    new FlywayConfig().repairAndMigrateStrategy().migrate(flyway);

    order.verify(flyway).repair();
    order.verify(flyway).migrate();
    verifyNoMoreInteractions(flyway);
  }
}
