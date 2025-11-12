package com.glancy.backend.llm.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.entity.Language;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class JacksonWordResponseParserTest {

  private final JacksonWordResponseParser parser =
      new JacksonWordResponseParser(new ObjectMapper());
  private static final String CHINESE_JSON =
      """
        {
          "词条": "glow",
          "原始输入": "glow",
          "纠正": false,
          "变形": [],
          "发音": {"英音": "/gloʊ/"},
          "发音解释": [
            {
              "释义": [
                {
                  "定义": "发出柔和的光",
                  "类别": "动词",
                  "例句": []
                }
              ]
            }
          ],
          "常见词组": []
        }
        """;

  /** 测试流程：构造包含中文字段的 JSON 结构，验证解析器能够正确读取词条、释义与音标信息。 */
  @Test
  void shouldParseChineseJsonPayload() {
    ParsedWord parsed = parser.parse(CHINESE_JSON, "glow", Language.ENGLISH);
    Assertions.assertEquals(CHINESE_JSON, parsed.markdown());
    var resp = parsed.parsed();
    Assertions.assertEquals(CHINESE_JSON, resp.getMarkdown());
    Assertions.assertEquals("glow", resp.getTerm());
    Assertions.assertFalse(resp.getDefinitions().isEmpty());
    Assertions.assertNotNull(resp.getPhonetic());
    Assertions.assertTrue(resp.getVariations().isEmpty());
    Assertions.assertTrue(resp.getPhrases().isEmpty());
  }

  /** 测试流程：提供仅包含 Markdown 结构的响应，校验回退策略能够提取标题作为词条与基础释义。 */
  @Test
  void shouldFallbackToMarkdownStructureWhenJsonMissing() {
    String markdown =
        "# Serendipity\n"
            + "## Definitions\n"
            + "- 意外发现珍宝的能力\n"
            + "Synonyms: fortuity, chance\n"
            + "Example: She found the book by pure serendipity.";

    ParsedWord parsed = parser.parse(markdown, "serendipity", Language.ENGLISH);

    Assertions.assertEquals(markdown, parsed.markdown());
    var response = parsed.parsed();
    Assertions.assertEquals("Serendipity", response.getTerm());
    Assertions.assertEquals(1, response.getDefinitions().size());
    Assertions.assertEquals("意外发现珍宝的能力", response.getDefinitions().get(0));
    Assertions.assertEquals(List.of("fortuity", "chance"), response.getSynonyms());
    Assertions.assertEquals("She found the book by pure serendipity.", response.getExample());
  }

  /** 测试流程：构造包含多级标题与列表的 Markdown 文本，验证解析器能够提取同义词、反义词、例句与发音。 */
  @Test
  void shouldExtractStructuredMetadataFromMarkdownSections() {
    String markdown =
        "# Illuminate\n"
            + "## 释义\n"
            + "1. 照亮; 使明亮\n"
            + "## 同义词\n"
            + "- light up\n"
            + "- brighten\n"
            + "## 反义词\n"
            + "- darken\n"
            + "### 例句\n"
            + "- The lantern illuminated the cave.\n"
            + "### 发音\n"
            + "- /ɪˈluːməˌneɪt/";

    ParsedWord parsed = parser.parse(markdown, "illuminate", Language.ENGLISH);
    var response = parsed.parsed();

    Assertions.assertEquals("Illuminate", response.getTerm());
    Assertions.assertEquals("照亮; 使明亮", response.getDefinitions().get(0));
    Assertions.assertEquals(List.of("light up", "brighten"), response.getSynonyms());
    Assertions.assertEquals(List.of("darken"), response.getAntonyms());
    Assertions.assertEquals("The lantern illuminated the cave.", response.getExample());
    Assertions.assertEquals("/ɪˈluːməˌneɪt/", response.getPhonetic());
  }
}
