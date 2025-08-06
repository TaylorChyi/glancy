package com.glancy.backend.repository;

import com.glancy.backend.entity.Faq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for FAQ entities allowing CRUD operations.
 */
@Repository
public interface FaqRepository extends JpaRepository<Faq, Long> {}
