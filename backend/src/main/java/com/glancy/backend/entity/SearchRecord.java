package com.glancy.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/** Record of a single dictionary search performed by a user. */
@Entity
@Table(name = "search_records")
@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class SearchRecord extends BaseEntity {

  @ManyToOne
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false, length = 100)
  private String term;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private Language language;

  @Column(nullable = false)
  private Boolean favorite = false;
}
