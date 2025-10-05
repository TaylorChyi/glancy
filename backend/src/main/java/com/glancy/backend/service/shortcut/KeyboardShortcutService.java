/**
 * 背景：
 *  - 快捷键此前只在前端硬编码，无法满足用户个性化与冲突校验诉求。
 * 目的：
 *  - 以应用服务封装快捷键的读取、保存与重置逻辑，协调仓储与规范化策略。
 * 关键决策与取舍：
 *  - 采用“服务 + 规范化策略”组合：服务负责流程，内部使用私有方法归一化按键；拒绝在控制器或实体层拼装字符串。
 * 影响范围：
 *  - 设置页面快捷键 API 的核心编排逻辑均由本服务承担。
 * 演进与TODO：
 *  - TODO: 若快捷键支持分层（全局/工作区），可引入策略接口替换当前私有方法并通过依赖注入切换实现。
 */
package com.glancy.backend.service.shortcut;

import com.glancy.backend.dto.KeyboardShortcutResponse;
import com.glancy.backend.dto.KeyboardShortcutUpdateRequest;
import com.glancy.backend.dto.KeyboardShortcutView;
import com.glancy.backend.entity.ShortcutAction;
import com.glancy.backend.entity.User;
import com.glancy.backend.entity.UserKeyboardShortcut;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserKeyboardShortcutRepository;
import com.glancy.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.util.*;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class KeyboardShortcutService {

    private static final List<String> MODIFIER_ORDER = List.of("MOD", "CONTROL", "META", "ALT", "SHIFT");

    private static final Set<String> MODIFIERS = Set.of("MOD", "CONTROL", "META", "ALT", "SHIFT");

    private final UserKeyboardShortcutRepository shortcutRepository;
    private final UserRepository userRepository;

    public KeyboardShortcutService(UserKeyboardShortcutRepository shortcutRepository, UserRepository userRepository) {
        this.shortcutRepository = shortcutRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public KeyboardShortcutResponse updateShortcut(
        Long userId,
        ShortcutAction action,
        KeyboardShortcutUpdateRequest request
    ) {
        log.info("Updating shortcut {} for user {}", action, userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        String normalizedBinding = normalizeBinding(request.keys());
        ensureBindingNotConflicting(userId, action, normalizedBinding);

        UserKeyboardShortcut entity = shortcutRepository
            .findByUserIdAndAction(userId, action)
            .orElseGet(() -> {
                UserKeyboardShortcut shortcut = new UserKeyboardShortcut();
                shortcut.setUser(user);
                shortcut.setAction(action);
                return shortcut;
            });
        entity.setBinding(normalizedBinding);
        shortcutRepository.save(entity);
        return buildResponse(userId);
    }

    @Transactional
    public KeyboardShortcutResponse resetShortcuts(Long userId) {
        log.info("Resetting shortcuts for user {}", userId);
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("用户不存在");
        }
        shortcutRepository.deleteByUserId(userId);
        return buildResponse(userId);
    }

    @Transactional
    public KeyboardShortcutResponse getShortcuts(Long userId) {
        log.info("Fetching shortcuts for user {}", userId);
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("用户不存在");
        }
        return buildResponse(userId);
    }

    private KeyboardShortcutResponse buildResponse(Long userId) {
        Map<ShortcutAction, UserKeyboardShortcut> overrides = shortcutRepository
            .findByUserId(userId)
            .stream()
            .collect(Collectors.toMap(UserKeyboardShortcut::getAction, shortcut -> shortcut));

        List<KeyboardShortcutView> views = Arrays.stream(ShortcutAction.values())
            .map(action -> {
                UserKeyboardShortcut override = overrides.get(action);
                List<String> keys = override != null ? decodeBinding(override.getBinding()) : action.getDefaultKeys();
                return new KeyboardShortcutView(action.name(), List.copyOf(keys), List.copyOf(action.getDefaultKeys()));
            })
            .toList();
        return new KeyboardShortcutResponse(views);
    }

    private void ensureBindingNotConflicting(Long userId, ShortcutAction targetAction, String binding) {
        Map<ShortcutAction, String> existingBindings = Arrays.stream(ShortcutAction.values()).collect(
                Collectors.toMap(
                    action -> action,
                    action ->
                        shortcutRepository
                            .findByUserIdAndAction(userId, action)
                            .map(UserKeyboardShortcut::getBinding)
                            .orElseGet(() -> String.join("+", action.getDefaultKeys()))
                )
            );

        Set<String> candidateAliases = expandBindingAliases(binding);
        for (Map.Entry<ShortcutAction, String> entry : existingBindings.entrySet()) {
            if (entry.getKey() == targetAction) {
                continue;
            }
            Set<String> existingAliases = expandBindingAliases(entry.getValue());
            boolean conflicting = existingAliases.stream().anyMatch(alias -> candidateAliases.contains(alias));
            if (conflicting) {
                throw new InvalidRequestException("快捷键已被其他功能占用");
            }
        }
    }

    /**
     * 意图：为冲突校验生成同一快捷键的等价表示，解决 MOD 与具体修饰键的别名问题。
     * 输入：规范化后的绑定字符串，例如 "MOD+SHIFT+F" 或 "CONTROL+SHIFT+F"。
     * 输出：包含所有可能等价组合的集合，元素形如 "CONTROL+SHIFT+F"。
     * 流程：
     *  1) 将绑定拆分为 token；
     *  2) 若存在 MOD，则同时生成 CONTROL 与 META 的组合；
     *  3) 其余场景保持原样返回；
     * 错误处理：输入为空字符串时返回空集合，由上层逻辑保证不会出现；
     * 复杂度：O(n) —— token 数量通常不超过 4，计算成本可忽略。
     */
    private Set<String> expandBindingAliases(String binding) {
        if (binding == null || binding.isBlank()) {
            return Set.of();
        }
        List<String> tokens = decodeBinding(binding);
        if (tokens.stream().noneMatch(token -> token.equals("MOD"))) {
            return Set.of(binding);
        }
        Set<String> aliases = new HashSet<>();
        for (String replacement : List.of("CONTROL", "META")) {
            List<String> replaced = tokens
                .stream()
                .map(token -> token.equals("MOD") ? replacement : token)
                .toList();
            aliases.add(String.join("+", replaced));
        }
        return aliases;
    }

    private List<String> decodeBinding(String binding) {
        if (binding == null || binding.isBlank()) {
            return List.of();
        }
        return Arrays.stream(binding.split("\\+"))
            .map(String::trim)
            .filter(token -> !token.isEmpty())
            .toList();
    }

    /**
     * 意图：将客户端提交的按键列表规范化为唯一字符串表示，兼顾大小写、别名与顺序。
     * 输入：按键字符串列表，可能包含空格、重复与修饰键别名。
     * 输出：形如 "MOD+SHIFT+F" 的字符串。
     * 流程：
     *  1) 遍历列表并清洗单个按键名称；
     *  2) 将修饰键去重并按约定顺序排列；
     *  3) 断言至少存在一个非修饰键；
     *  4) 拼接为统一格式字符串。
     * 错误处理：遇到空值、非法别名或缺少主体键时抛出 InvalidRequestException。
     * 复杂度：时间 O(n)，空间 O(1)。
     */
    private String normalizeBinding(List<String> keys) {
        if (keys == null || keys.isEmpty()) {
            throw new InvalidRequestException("请至少选择一个按键");
        }
        Set<String> modifiers = new LinkedHashSet<>();
        String primary = null;
        for (String raw : keys) {
            String token = normalizeToken(raw);
            if (MODIFIERS.contains(token)) {
                modifiers.add(token);
                continue;
            }
            if (primary != null) {
                throw new InvalidRequestException("仅支持单个主按键");
            }
            primary = token;
        }
        if (primary == null) {
            throw new InvalidRequestException("快捷键需包含一个主按键");
        }
        if (modifiers.contains("MOD") && modifiers.size() > 1) {
            throw new InvalidRequestException("MOD 不能与具体修饰键同时使用");
        }
        List<String> ordered = new ArrayList<>();
        for (String modifier : MODIFIER_ORDER) {
            if (modifiers.contains(modifier)) {
                ordered.add(modifier);
            }
        }
        modifiers
            .stream()
            .filter(mod -> !MODIFIER_ORDER.contains(mod))
            .forEach(ordered::add);
        ordered.add(primary);
        return String.join("+", ordered);
    }

    private String normalizeToken(String raw) {
        if (raw == null) {
            throw new InvalidRequestException("按键名称不能为空");
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            throw new InvalidRequestException("按键名称不能为空");
        }
        int end = trimmed.length();
        while (end > 0 && !Character.isLetterOrDigit(trimmed.charAt(end - 1))) {
            end--;
        }
        trimmed = trimmed.substring(0, end).trim();
        if (trimmed.isEmpty()) {
            throw new InvalidRequestException("按键名称不能为空");
        }
        String normalized = trimmed.replace(' ', '_').toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "CMD", "COMMAND" -> "META";
            case "CTRL" -> "CONTROL";
            case "OPTION" -> "ALT";
            case "RETURN" -> "ENTER";
            case "ESC" -> "ESCAPE";
            case "SPACEBAR" -> "SPACE";
            default -> normalized;
        };
    }
}
