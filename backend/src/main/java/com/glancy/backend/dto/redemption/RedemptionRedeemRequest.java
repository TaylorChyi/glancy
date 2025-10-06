package com.glancy.backend.dto.redemption;

import jakarta.validation.constraints.NotBlank;

/**
 * 背景：
 *  - 用户发起兑换时需要传入兑换码。
 * 目的：
 *  - 提供基本的参数约束。
 * 关键决策与取舍：
 *  - 仅包含编码字段，身份信息由认证上下文提供。
 * 影响范围：
 *  - 兑换接口请求体。
 * 演进与TODO：
 *  - 如需记录渠道，可追加字段。
 */
public record RedemptionRedeemRequest(@NotBlank(message = "兑换码不能为空") String code) {}
