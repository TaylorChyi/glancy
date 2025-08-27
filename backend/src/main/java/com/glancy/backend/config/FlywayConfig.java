package com.glancy.backend.config;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;
import org.flywaydb.core.api.FlywayException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.flyway.FlywayConfigurationCustomizer;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 自定义 Flyway 迁移配置。
 *
 * <p>通过数据库锁保证只有一个实例执行迁移，同时彻底禁止 {@code clean} 操作。
 */
@Configuration
public class FlywayConfig {

  private static final Logger log = LoggerFactory.getLogger(FlywayConfig.class);

  /** 禁用 Flyway 的 clean 操作，避免误删数据。 */
  @Bean
  FlywayConfigurationCustomizer disableFlywayClean() {
    log.warn("Flyway clean 操作已被禁用，如需重置数据库请手动执行");
    return configuration -> configuration.cleanDisabled(true);
  }

  /**
   * 使用基于数据库的简单锁保证只有一个实例执行迁移。
   *
   * @param dataSource 数据源
   * @return 迁移策略
   */
  @Bean
  FlywayMigrationStrategy migrationStrategy(DataSource dataSource) {
    return flyway -> {
      try (Connection connection = dataSource.getConnection();
          Statement statement = connection.createStatement()) {
        connection.setAutoCommit(false);
        statement.execute("CREATE TABLE IF NOT EXISTS flyway_lock (id INT PRIMARY KEY)");
        try {
          statement.executeUpdate("INSERT INTO flyway_lock (id) VALUES (1)");
        } catch (SQLException ignored) {
          // 记录已存在，无需处理
        }
        try (PreparedStatement ps =
            connection.prepareStatement(
                "SELECT id FROM flyway_lock WHERE id = 1 FOR UPDATE")) {
          ps.executeQuery();
          flyway.migrate();
          connection.commit();
        }
      } catch (SQLException ex) {
        throw new FlywayException("数据库迁移失败", ex);
      }
    };
  }
}
