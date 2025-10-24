/**
 * 背景：
 *  - 词条响应 DTO 以前与聊天、搜索模型混在一起，词典领域边界模糊。
 * 目的：
 *  - 在 word 包集中描述词条返回结构，包含释义、变体与个性化信息。
 * 关键决策与取舍：
 *  - 保持数据载体与个性化解释引用，业务拼装仍在服务层；包划分强调词典领域。
 * 影响范围：
 *  - WordController、LLM 解析器及个性化服务导入路径更新。
 * 演进与TODO：
 *  - 若需支持多版本并行，可在本包扩展版本列表或视图模型。
 */
package com.glancy.backend.dto.word;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WordResponse {

    private String id;
    private String term;
    private List<String> definitions;
    private Language language;
    private String example;
    private String phonetic;
    private List<String> variations;
    private List<String> synonyms;
    private List<String> antonyms;
    private List<String> related;
    private List<String> phrases;
    private String markdown;
    private Long versionId;
    private PersonalizedWordExplanation personalization;
    private DictionaryFlavor flavor;
}
