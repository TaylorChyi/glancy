package com.glancy.backend.repository;

import com.glancy.backend.entity.ShortcutAction;
import com.glancy.backend.entity.UserKeyboardShortcut;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository storing per-user overrides for keyboard shortcuts.
 */
public interface UserKeyboardShortcutRepository extends JpaRepository<UserKeyboardShortcut, Long> {
    List<UserKeyboardShortcut> findByUserId(Long userId);

    Optional<UserKeyboardShortcut> findByUserIdAndAction(Long userId, ShortcutAction action);

    void deleteByUserId(Long userId);
}
