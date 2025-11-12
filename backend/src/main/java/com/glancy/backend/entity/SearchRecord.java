package com.glancy.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
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

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private DictionaryFlavor flavor = DictionaryFlavor.BILINGUAL;

  @Column(nullable = false)
  private Boolean favorite = false;
}
