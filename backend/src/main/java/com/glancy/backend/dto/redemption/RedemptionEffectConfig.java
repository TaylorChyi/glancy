package com.glancy.backend.dto.redemption;

import com.glancy.backend.entity.redemption.RedemptionEffectType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * 背景：
 *  - 兑换码需要携带不同效果参数。
 * 目的：
 *  - 定义效果类型及对应配置，便于策略模式识别。
 * 关键决策与取舍：
 *  - 采用分支 record，以类型+配置形式表达，避免在服务层处理原始 map。
 * 影响范围：
 *  - 服务层处理逻辑、响应映射。
 * 演进与TODO：
 *  - 如需支持多效果组合，可改为列表结构。
 */
public record RedemptionEffectConfig(
    @NotNull(message = "兑换效果类型不能为空") RedemptionEffectType type,
    @Valid MembershipEffectConfig membership,
    @Valid DiscountEffectConfig discount
) {}
