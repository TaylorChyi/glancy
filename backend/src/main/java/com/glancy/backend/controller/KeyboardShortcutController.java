package com.glancy.backend.controller;

import com.glancy.backend.config.auth.AuthenticatedUser;
import com.glancy.backend.dto.keyboard.KeyboardShortcutResponse;
import com.glancy.backend.dto.keyboard.KeyboardShortcutUpdateRequest;
import com.glancy.backend.entity.ShortcutAction;
import com.glancy.backend.service.shortcut.KeyboardShortcutService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 管理用户快捷键的读取、更新与重置。
 */
@RestController
@RequestMapping("/api/preferences/shortcuts")
@Slf4j
public class KeyboardShortcutController {

    private final KeyboardShortcutService keyboardShortcutService;

    public KeyboardShortcutController(KeyboardShortcutService keyboardShortcutService) {
        this.keyboardShortcutService = keyboardShortcutService;
    }

    /**
     * 获取用户当前快捷键配置。
     */
    @GetMapping("/user")
    public ResponseEntity<KeyboardShortcutResponse> getShortcuts(@AuthenticatedUser Long userId) {
        return ResponseEntity.ok(keyboardShortcutService.getShortcuts(userId));
    }

    /**
     * 更新指定动作的快捷键。
     */
    @PutMapping("/user/{action}")
    public ResponseEntity<KeyboardShortcutResponse> updateShortcut(
        @AuthenticatedUser Long userId,
        @PathVariable ShortcutAction action,
        @Valid @RequestBody KeyboardShortcutUpdateRequest request
    ) {
        return ResponseEntity.ok(keyboardShortcutService.updateShortcut(userId, action, request));
    }

    /**
     * 恢复所有快捷键到默认值。
     */
    @DeleteMapping("/user")
    public ResponseEntity<KeyboardShortcutResponse> resetShortcuts(@AuthenticatedUser Long userId) {
        return ResponseEntity.ok(keyboardShortcutService.resetShortcuts(userId));
    }
}
