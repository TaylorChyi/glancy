package com.glancy.backend.llm.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.llm.prompt.PromptTemplateRenderer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WordEntryProfileResolverTest {

  private WordEntryProfileResolver resolver;

  @BeforeEach
  void setUp() {
    resolver = new WordEntryProfileResolver(new PromptTemplateRenderer());
  }

  /**
   * 测试目标：验证单字输入命中单字模板，输出英文标签与拆解指引。 前置条件：渲染器基于内存常量模板。 步骤： 1) 调用解析器处理单个汉字。 断言： - 类型为 Single
   * Character； - 指引包含“拆解字源”。 边界/异常： - 若模板缺失则会抛出异常，本用例不覆盖。
   */
  @Test
  void GivenSingleCharacter_WhenResolve_ThenReturnSingleProfile() {
    WordEntryProfileResolver.EntryProfile profile =
        resolver.resolve(Language.CHINESE, "汉", DictionaryFlavor.MONOLINGUAL_CHINESE);
    assertEquals("Single Character\n", profile.typeLabel());
    assertTrue(profile.guidance().contains("拆解字源"));
  }

  /**
   * 测试目标：验证英文查询走默认策略输出通用标签。 前置条件：渲染器基于内存常量模板，未注册英文专属策略。 步骤： 1) 解析英文输入。 断言： - 返回默认标签 General Entry；
   * - 指引包含“标准词典条目结构”。 边界/异常： - 若新增英文策略，该断言需同步调整。
   */
  @Test
  void GivenEnglishWord_WhenResolve_ThenReturnDefaultProfile() {
    WordEntryProfileResolver.EntryProfile profile =
        resolver.resolve(Language.ENGLISH, "elegance", DictionaryFlavor.BILINGUAL);
    assertEquals("General Entry\n", profile.typeLabel());
    assertTrue(profile.guidance().contains("标准词典条目结构"));
  }

  /**
   * 测试目标：验证混写输入命中混合脚本模板，提示补充借词背景。 前置条件：输入包含汉字与字母。 步骤： 1) 调用解析器处理混写词语。 断言： - 标签为 Multi-character
   * Word； - 指引包含“借词背景”。 边界/异常： - 若模板变更需同步更新关键词。
   */
  @Test
  void GivenMixedScript_WhenResolve_ThenReturnMixedGuidance() {
    WordEntryProfileResolver.EntryProfile profile =
        resolver.resolve(Language.CHINESE, "咖啡Latte", DictionaryFlavor.BILINGUAL);
    assertEquals("Multi-character Word\n", profile.typeLabel());
    assertTrue(profile.guidance().contains("借词背景"));
  }
}
