package com.glancy.backend.repository;

import com.glancy.backend.entity.EmailAudience;
import com.glancy.backend.entity.EmailStream;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Repository for subscription and suppression state of email addresses. */
public interface EmailAudienceRepository extends JpaRepository<EmailAudience, Long> {
    Optional<EmailAudience> findByEmailAndStream(String email, EmailStream stream);
}
