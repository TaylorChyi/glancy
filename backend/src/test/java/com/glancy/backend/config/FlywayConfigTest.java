package com.glancy.backend.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/** Tests for {@link FlywayConfig}. */
@SpringBootTest
class FlywayConfigTest {

  @Autowired private Flyway flyway;

  @Autowired private DataSource dataSource;

  /** 验证 Flyway clean 被禁用且历史表存在。 */
  @Test
  void disablesCleanAndCreatesHistoryTable() throws Exception {
    assertThat(flyway.getConfiguration().isCleanDisabled()).isTrue();
    assertThatThrownBy(() -> flyway.clean()).isInstanceOf(FlywayException.class);
    try (Connection connection = dataSource.getConnection()) {
      DatabaseMetaData metaData = connection.getMetaData();
      try (ResultSet tables =
          metaData.getTables(null, null, "flyway_schema_history".toUpperCase(), null)) {
        assertThat(tables.next()).isTrue();
      }
    }
  }
}
