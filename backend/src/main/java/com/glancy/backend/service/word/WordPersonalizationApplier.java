package com.glancy.backend.service.word;

import com.glancy.backend.dto.WordPersonalizationContext;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.service.personalization.WordPersonalizationService;
import com.glancy.backend.util.SensitiveDataUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - 个性化逻辑在多个流程里重复 try-catch 包裹，异常处理分散。\
 * 目的：
 *  - 提供单一入口执行个性化回写，统一日志格式并便于未来扩展指标。\
 * 关键决策与取舍：
 *  - 使用组合方式封装 `WordPersonalizationService`，保持业务接口语义；\
 *  - 遇到异常时只记录警告而不中断主流程，权衡可靠性与可用性。\
 * 影响范围：
 *  - 被查词策略与持久化流程调用。\
 * 演进与TODO：
 *  - 可在此加入埋点或灰度开关，实现更精细的个性化策略控制。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WordPersonalizationApplier {

    private final WordPersonalizationService wordPersonalizationService;

    public WordResponse apply(Long userId, WordResponse response, WordPersonalizationContext context) {
        if (response == null) {
            return null;
        }
        try {
            WordPersonalizationContext effectiveContext = context != null
                ? context
                : wordPersonalizationService.resolveContext(userId);
            response.setPersonalization(wordPersonalizationService.personalize(effectiveContext, response));
        } catch (Exception ex) {
            log.warn(
                "Failed to personalize response for user {} term '{}': {}",
                userId,
                response.getTerm(),
                SensitiveDataUtil.previewText(ex.getMessage())
            );
        }
        return response;
    }
}
