package com.glancy.backend.service.support;

import com.glancy.backend.entity.Word;

/**
 * 背景：
 *  - 历史版本内容的生成方式在同步与流式路径存在差异，直接内联在服务层导致可读性下降。\
 * 目的：
 *  - 通过策略模式封装版本内容生成逻辑，解耦流程骨架与内容来源。\
 * 关键决策与取舍：
 *  - 选用策略模式以便未来新增版本来源（如多模态摘要）时无需修改模板流程；\
 *  - 放弃简单的条件判断，代价是上下文需要暴露额外状态（如流式净化文本）。\
 * 影响范围：
 *  - WordPersistenceCoordinator 根据实现选择不同内容策略；\
 *  - 新增策略只需实现该接口并在调用端注入即可生效。
 * 演进与TODO：
 *  - 可进一步引入注册表以支持按语言或模型动态选择策略；\
 *  - 若版本内容需要结构化存储，可调整返回类型为值对象。
 */
public interface WordVersionContentStrategy {
    /**
     * 根据持久化上下文与保存后的词条生成历史版本内容。
     *
     * @param context 当前持久化上下文
     * @param savedWord 已落库的词条实体
     * @return 版本内容字符串，返回 {@code null} 表示跳过版本持久化
     */
    String resolveContent(WordPersistenceCoordinator.PersistenceContext context, Word savedWord);
}
