/**
 * 背景：
 *  - 搜索记录请求原本与聊天、用户等 DTO 同层，搜索领域难以聚焦。
 * 目的：
 *  - 在 search 包集中表达用户查询行为，方便扩展词典特性。
 * 关键决策与取舍：
 *  - 维持简单字段与默认 flavor，策略逻辑交由服务层；包划分突出词典场景。
 * 影响范围：
 *  - 搜索接口及服务导入路径更新。
 * 演进与TODO：
 *  - 若需记录更多上下文（如来源设备），可在本包扩展字段。
 */
package com.glancy.backend.dto.search;

import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request payload representing a user's word search.
 */
@Data
public class SearchRecordRequest {

    @NotBlank(message = "{validation.searchRecord.term.notblank}")
    private String term;

    @NotNull(message = "{validation.searchRecord.language.notnull}")
    private Language language;

    private DictionaryFlavor flavor = DictionaryFlavor.BILINGUAL;
}
