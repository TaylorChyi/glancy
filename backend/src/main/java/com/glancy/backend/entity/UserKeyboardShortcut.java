package com.glancy.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "user_keyboard_shortcuts",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_action", columnNames = { "user_id", "action" }),
        @UniqueConstraint(name = "uk_user_binding", columnNames = { "user_id", "binding" }),
    }
)
@Getter
@Setter
public class UserKeyboardShortcut {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ShortcutAction action;

    @Column(nullable = false, length = 120)
    private String binding;
}
