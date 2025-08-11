package com.glancy.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables JPA auditing to automatically populate entity timestamp fields.
 */
@Configuration
@EnableJpaAuditing
public class AuditingConfig {}
