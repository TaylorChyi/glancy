/**
 * 背景：
 *  - 为了承载用户自定义快捷键，需要将按键绑定持久化，而原有偏好实体未覆盖该能力。
 * 目的：
 *  - 建模用户与快捷键动作之间的一对多关系，保存用户覆盖默认值后的组合。
 * 关键决策与取舍：
 *  - 采用单表按动作枚举存储，避免 JSON 字段难以索引与迁移；通过唯一索引保障同一用户同一动作仅存在一条记录。
 * 影响范围：
 *  - KeyboardShortcutService 通过该实体完成增删改查。
 * 演进与TODO：
 *  - TODO: 后续若引入多方案切换，可扩展 version 字段并建立历史表。
 */
package com.glancy.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "user_keyboard_shortcuts",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_action", columnNames = {"user_id", "action"}),
        @UniqueConstraint(name = "uk_user_binding", columnNames = {"user_id", "binding"})
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
