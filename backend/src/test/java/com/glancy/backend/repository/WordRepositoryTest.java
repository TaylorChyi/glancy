package com.glancy.backend.repository;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.Word;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class WordRepositoryTest {

  @Autowired private WordRepository wordRepository;

  /**
   * 测试目标：验证归一化查询可命中未删除的词条记录。 前置条件： - 预先保存一条英文词条。 步骤： 1) 调用 findActiveByNormalizedTerm 检索同词条。 断言： -
   * 查询结果存在且术语匹配。 边界/异常： - 覆盖基础仓储查询能力。
   */
  @Test
  void findActiveByNormalizedTerm() {
    Word word = TestEntityFactory.word("hello", Language.ENGLISH);
    wordRepository.save(word);

    Optional<Word> found =
        wordRepository.findActiveByNormalizedTerm(
            "hello", Language.ENGLISH, DictionaryFlavor.BILINGUAL);
    Assertions.assertTrue(found.isPresent());
    Assertions.assertEquals("hello", found.get().getTerm());
  }
}
