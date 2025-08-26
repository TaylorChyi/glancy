package com.glancy.backend.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Ensures failed Flyway migrations do not prevent application startup
 * by repairing the schema history before running migrations.
 */
@Configuration
public class FlywayConfig {

  /**
   * Repairs the Flyway schema history before applying pending migrations.
   *
   * @return migration strategy invoking {@link Flyway#repair()} then {@link Flyway#migrate()}
   */
  @Bean
  public FlywayMigrationStrategy repairAndMigrateStrategy() {
    return flyway -> {
      flyway.repair();
      flyway.migrate();
    };
  }
}
