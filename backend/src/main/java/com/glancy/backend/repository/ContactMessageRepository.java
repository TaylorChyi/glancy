package com.glancy.backend.repository;

import com.glancy.backend.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * JPA repository for persisting user-submitted contact messages.
 */
@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {}
