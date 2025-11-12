package com.glancy.backend.service.support;

import com.glancy.backend.entity.Word;

public interface WordVersionContentStrategy {
  /**
   * 根据持久化上下文与保存后的词条生成历史版本内容。
   *
   * @param context 当前持久化上下文
   * @param savedWord 已落库的词条实体
   * @return 版本内容字符串，返回 {@code null} 表示跳过版本持久化
   */
  String resolveContent(WordPersistenceContext context, Word savedWord);
}
