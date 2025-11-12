package com.glancy.backend.entity;

import java.util.Locale;
import java.util.Optional;

public enum MembershipType {
  NONE(0),
  PLUS(1),
  PRO(2),
  PREMIUM(3);

  private final int priority;

  MembershipType(int priority) {
    this.priority = priority;
  }

  /** 判断当前等级是否至少具备目标等级所需的优先级。 */
  public boolean canAccess(MembershipType required) {
    return required == null || this.priority >= required.priority;
  }

  /**
   * 根据配置中的计划标签解析所需的会员等级。
   *
   * @param plan 配置声明的计划标签，例如 "pro"、"premium"。
   * @return 若计划对所有用户开放返回 {@link Optional#empty()}，否则返回对应的最低会员等级。
   */
  public static Optional<MembershipType> fromPlanLabel(String plan) {
    if (plan == null || plan.isBlank()) {
      return Optional.empty();
    }
    String normalized = plan.trim().toLowerCase(Locale.ROOT);
    return switch (normalized) {
      case "all", "free" -> Optional.empty();
      case "plus" -> Optional.of(PLUS);
      case "pro" -> Optional.of(PRO);
      case "premium" -> Optional.of(PREMIUM);
      default -> Optional.of(PREMIUM);
    };
  }
}
