package com.glancy.backend.service.redemption.effect;

import com.glancy.backend.entity.User;
import com.glancy.backend.entity.redemption.RedemptionCode;
import com.glancy.backend.entity.redemption.RedemptionEffectType;
import com.glancy.backend.service.redemption.model.RedemptionOutcome;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 兑换码效果类型多样，需要策略模式来解耦处理逻辑。
 * 目的：
 *  - 定义策略接口，封装不同效果的执行与结果。
 * 关键决策与取舍：
 *  - 通过 supportedType 显式声明支持的效果，避免硬编码 if/else；
 *  - process 返回领域结果以供服务层转换为 DTO。
 * 影响范围：
 *  - 新增效果时需实现该接口并注册为 Spring Bean。
 * 演进与TODO：
 *  - 可结合责任链支持组合效果。
 */
public interface RedemptionEffectProcessor {
    RedemptionEffectType supportedType();

    RedemptionOutcome process(RedemptionCode code, User user, LocalDateTime redemptionTime);
}
