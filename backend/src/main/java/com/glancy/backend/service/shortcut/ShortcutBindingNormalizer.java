package com.glancy.backend.service.shortcut;

import com.glancy.backend.exception.InvalidRequestException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
class ShortcutBindingNormalizer {

  private static final List<String> MODIFIER_ORDER =
      List.of("MOD", "CONTROL", "META", "ALT", "SHIFT");
  private static final Set<String> MODIFIERS = Set.of("MOD", "CONTROL", "META", "ALT", "SHIFT");

  String normalize(List<String> keys) {
    BindingContext context = collectBindingContext(keys);
    assertPrimaryPresent(context.primary());
    assertValidModifierUsage(context.modifiers());
    List<String> ordered = orderModifiers(context.modifiers());
    ordered.add(context.primary());
    return String.join("+", ordered);
  }

  Set<String> expandAliases(String binding) {
    if (binding == null || binding.isBlank()) {
      return Set.of();
    }
    List<String> tokens = decodeBinding(binding);
    if (tokens.stream().noneMatch(token -> token.equals("MOD"))) {
      return Set.of(binding);
    }
    Set<String> aliases = new HashSet<>();
    for (String replacement : List.of("CONTROL", "META")) {
      List<String> replaced =
          tokens.stream().map(token -> token.equals("MOD") ? replacement : token).toList();
      aliases.add(String.join("+", replaced));
    }
    return aliases;
  }

  private BindingContext collectBindingContext(List<String> keys) {
    if (keys == null || keys.isEmpty()) {
      throw new InvalidRequestException("请至少选择一个按键");
    }
    LinkedHashSet<String> modifiers = new LinkedHashSet<>();
    String primary = null;
    for (String raw : keys) {
      String token = normalizeToken(raw);
      if (MODIFIERS.contains(token)) {
        modifiers.add(token);
      } else {
        if (primary != null) {
          throw new InvalidRequestException("仅支持单个主按键");
        }
        primary = token;
      }
    }
    return new BindingContext(modifiers, primary);
  }

  private void assertPrimaryPresent(String primary) {
    if (primary == null) {
      throw new InvalidRequestException("快捷键需包含一个主按键");
    }
  }

  private void assertValidModifierUsage(Set<String> modifiers) {
    if (modifiers.contains("MOD") && modifiers.size() > 1) {
      throw new InvalidRequestException("MOD 不能与具体修饰键同时使用");
    }
  }

  private List<String> orderModifiers(Set<String> modifiers) {
    List<String> ordered = new ArrayList<>();
    for (String modifier : MODIFIER_ORDER) {
      if (modifiers.contains(modifier)) {
        ordered.add(modifier);
      }
    }
    modifiers.stream().filter(mod -> !MODIFIER_ORDER.contains(mod)).forEach(ordered::add);
    return ordered;
  }

  private List<String> decodeBinding(String binding) {
    if (binding == null || binding.isBlank()) {
      return List.of();
    }
    return java.util.Arrays.stream(binding.split("\\+"))
        .map(String::trim)
        .filter(token -> !token.isEmpty())
        .toList();
  }

  private String normalizeToken(String raw) {
    String sanitized = stripTrailingSymbols(requireNonBlank(raw));
    String normalized = sanitized.replace(' ', '_').toUpperCase(Locale.ROOT);
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

  private String requireNonBlank(String raw) {
    if (raw == null) {
      throw new InvalidRequestException("按键名称不能为空");
    }
    String trimmed = raw.trim();
    if (trimmed.isEmpty()) {
      throw new InvalidRequestException("按键名称不能为空");
    }
    return trimmed;
  }

  private String stripTrailingSymbols(String value) {
    int end = value.length();
    while (end > 0 && !Character.isLetterOrDigit(value.charAt(end - 1))) {
      end--;
    }
    String trimmed = value.substring(0, end).trim();
    if (trimmed.isEmpty()) {
      throw new InvalidRequestException("按键名称不能为空");
    }
    return trimmed;
  }

  private record BindingContext(LinkedHashSet<String> modifiers, String primary) {}
}
