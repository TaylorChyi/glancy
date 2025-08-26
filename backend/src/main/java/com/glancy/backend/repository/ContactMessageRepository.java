package com.glancy.backend.repository;

import com.glancy.backend.entity.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Repository for messages submitted through the contact form. */
@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {}
