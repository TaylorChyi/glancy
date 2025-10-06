package com.glancy.backend.dto.redemption;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 管理端需要配置兑换码。
 * 目的：
 *  - 定义创建兑换码所需的输入参数，并提供基础校验。
 * 关键决策与取舍：
 *  - 使用 record 以保证不可变与可读性；
 *  - 采用 @Valid 递归校验效果配置。
 * 影响范围：
 *  - 控制器与服务层创建逻辑。
 * 演进与TODO：
 *  - 后续若支持批量导入，可复用该 DTO 进行列表校验。
 */
public record RedemptionCodeCreateRequest(
    @NotBlank(message = "兑换码编码不能为空") String code,
    @NotNull(message = "兑换开始时间不能为空") LocalDateTime redeemableFrom,
    @NotNull(message = "兑换结束时间不能为空") LocalDateTime redeemableUntil,
    @Min(value = 1, message = "总兑换次数需大于 0") int totalQuota,
    @Min(value = 1, message = "单用户兑换次数需大于 0") int perUserQuota,
    @NotNull(message = "兑换效果不能为空") @Valid RedemptionEffectConfig effect
) {}
