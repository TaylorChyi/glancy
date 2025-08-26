package com.glancy.backend.llm.parser;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.entity.Language;
import org.junit.jupiter.api.Test;

class JacksonWordResponseParserTest {

  @Test
  void parseChineseJson() {
    String json =
        "{\n"
            + "  \"词条\": \"glow\",\n"
            + "  \"原始输入\": \"glow\",\n"
            + "  \"纠正\": false,\n"
            + "  \"变形\": [],\n"
            + "  \"发音\": {\"英音\": \"/gloʊ/\"},\n"
            + "  \"发音解释\": [\n"
            + "    {\n"
            + "      \"释义\": [\n"
            + "        {\n"
            + "          \"定义\": \"发出柔和的光\",\n"
            + "          \"类别\": \"动词\",\n"
            + "          \"例句\": []\n"
            + "        }\n"
            + "      ]\n"
            + "    }\n"
            + "  ],\n"
            + "  \"常见词组\": []\n"
            + "}";

    JacksonWordResponseParser parser = new JacksonWordResponseParser();
    ParsedWord parsed = parser.parse(json, "glow", Language.ENGLISH);
    assertEquals(json, parsed.markdown());
    var resp = parsed.parsed();
    assertEquals(json, resp.getMarkdown());
    assertEquals("glow", resp.getTerm());
    assertFalse(resp.getDefinitions().isEmpty());
    assertNotNull(resp.getPhonetic());
    assertTrue(resp.getVariations().isEmpty());
    assertTrue(resp.getPhrases().isEmpty());
  }
}
