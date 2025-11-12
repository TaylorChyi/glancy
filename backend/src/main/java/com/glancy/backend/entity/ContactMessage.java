package com.glancy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * Stores feedback or enquiries submitted via the contact form so that support agents can follow up
 * asynchronously.
 */
@Entity
@Table(name = "contact_messages")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ContactMessage extends BaseEntity {

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, length = 150)
  private String email;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;
}
