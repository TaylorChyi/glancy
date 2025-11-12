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
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class KeyboardShortcutService {

    private final UserKeyboardShortcutRepository shortcutRepository;
    private final UserRepository userRepository;
    private final ShortcutBindingNormalizer bindingNormalizer;

    public KeyboardShortcutService(
        UserKeyboardShortcutRepository shortcutRepository,
        UserRepository userRepository,
        ShortcutBindingNormalizer bindingNormalizer
    ) {
        this.shortcutRepository = shortcutRepository;
        this.userRepository = userRepository;
        this.bindingNormalizer = bindingNormalizer;
    }

    @Transactional
    public KeyboardShortcutResponse updateShortcut(
        Long userId,
        ShortcutAction action,
        KeyboardShortcutUpdateRequest request
    ) {
        log.info("Updating shortcut {} for user {}", action, userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));

        String normalizedBinding = bindingNormalizer.normalize(request.keys());
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

        Set<String> candidateAliases = bindingNormalizer.expandAliases(binding);
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

    private List<String> decodeBinding(String binding) {
        if (binding == null || binding.isBlank()) {
            return List.of();
        }
        return Arrays.stream(binding.split("\\+"))
            .map(String::trim)
            .filter(token -> !token.isEmpty())
            .toList();
    }

    private Set<String> expandBindingAliases(String binding) {
        if (binding == null || binding.isBlank()) {
            return Set.of();
        }
        Set<String> aliases = bindingNormalizer.expandAliases(binding);
        if (aliases.isEmpty() || aliases.contains(binding)) {
            return aliases.isEmpty() ? Set.of(binding) : aliases;
        }
        Set<String> merged = new HashSet<>(aliases);
        merged.add(binding);
        return merged;
    }
}
