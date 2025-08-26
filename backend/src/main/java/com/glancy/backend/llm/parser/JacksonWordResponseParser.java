package com.glancy.backend.llm.parser;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JacksonWordResponseParser implements WordResponseParser {

  @Override
  public ParsedWord parse(String content, String term, Language language) {
    String markdown = content;
    String json = extractJson(content);
    try {
      ObjectMapper mapper = new ObjectMapper();
      var node = mapper.readTree(json);

      String id = node.path("id").isNull() ? null : node.path("id").asText();

      String parsedTerm = node.path("term").asText(null);
      if (parsedTerm == null || parsedTerm.isEmpty()) {
        parsedTerm = node.path("entry").asText(null);
      }
      if (parsedTerm == null || parsedTerm.isEmpty()) {
        parsedTerm = node.path("\u8BCD\u6761").asText(term); // "词条"
      }

      List<String> synonyms = new ArrayList<>();
      List<String> antonyms = new ArrayList<>();
      List<String> related = new ArrayList<>();

      List<String> definitions = parseEnglishDefinitions(node, synonyms, antonyms, related);
      if (definitions.isEmpty()) {
        definitions = parseChineseDefinitions(node, synonyms, antonyms, related);
      }

      List<String> variations = parseVariations(node);
      List<String> phrases = parsePhrases(node);

      Language lang = parseLanguage(node, language);

      String example = parseExample(node, definitions);

      String phonetic = parsePhonetic(node);

      WordResponse response =
          new WordResponse(
              id,
              parsedTerm,
              definitions,
              lang,
              example,
              phonetic,
              variations,
              synonyms,
              antonyms,
              related,
              phrases,
              markdown);
      return new ParsedWord(response, markdown);
    } catch (Exception e) {
      log.warn("Failed to parse word response", e);
      WordResponse response =
          new WordResponse(
              null,
              term,
              new ArrayList<>(),
              language,
              null,
              null,
              new ArrayList<>(),
              new ArrayList<>(),
              new ArrayList<>(),
              new ArrayList<>(),
              new ArrayList<>(),
              markdown);
      return new ParsedWord(response, markdown);
    }
  }

  private List<String> parseEnglishDefinitions(
      com.fasterxml.jackson.databind.JsonNode node,
      List<String> synonyms,
      List<String> antonyms,
      List<String> related) {
    List<String> definitions = new ArrayList<>();
    var defsNode = node.path("definitions");
    if (defsNode.isArray()) {
      defsNode.forEach(
          n -> {
            String part = n.path("partOfSpeech").asText();
            var meaningsNode = n.path("meanings");
            List<String> meanings = new ArrayList<>();
            if (meaningsNode.isArray()) {
              meaningsNode.forEach(m -> meanings.add(m.asText()));
            } else if (n.has("definition")) {
              meanings.add(n.path("definition").asText());
            }
            String combined = String.join("; ", meanings);
            if (!combined.isEmpty()) {
              definitions.add(part.isEmpty() ? combined : part + ": " + combined);
            }
            addFromNode(n, "synonyms", synonyms);
            addFromNode(n, "antonyms", antonyms);
            addFromNode(n, "related", related);
          });
    } else if (defsNode.isTextual()) {
      definitions.add(defsNode.asText());
    }
    return definitions;
  }

  private List<String> parseChineseDefinitions(
      com.fasterxml.jackson.databind.JsonNode node,
      List<String> synonyms,
      List<String> antonyms,
      List<String> related) {
    List<String> definitions = new ArrayList<>();
    var explainNode = node.path("\u53D1\u97F3\u89E3\u91CA"); // "发音解释"
    if (explainNode.isArray()) {
      for (var exp : explainNode) {
        var defList = exp.path("\u91CA\u4E49"); // "释义"
        if (defList.isArray()) {
          for (var d : defList) {
            String def = d.path("\u5B9A\u4E49").asText(); // "定义"
            String part = d.path("\u7C7B\u522B").asText(); // "类别"
            String combined = def;
            if (!part.isEmpty()) {
              combined = part + ": " + def;
            }
            if (!combined.isEmpty()) {
              definitions.add(combined);
            }
            var relation = d.path("\u5173\u7CFB\u8BCD"); // "关系词"
            if (relation.isObject()) {
              addFromNode(relation, "\u540C\u4E49\u8BCD", synonyms); // 同义词
              addFromNode(relation, "\u53CD\u4E49\u8BCD", antonyms); // 反义词
              addFromNode(relation, "\u76F8\u5173\u8BCD", related); // 相关词
            }
          }
        }
      }
    }
    return definitions;
  }

  private List<String> parseVariations(com.fasterxml.jackson.databind.JsonNode node) {
    List<String> variations = new ArrayList<>();
    var formsNode = node.path("\u53D8\u5F62"); // "变形"
    if (formsNode.isArray()) {
      for (var form : formsNode) {
        String state = form.path("\u72B6\u6001").asText(); // "状态"
        String word = form.path("\u8BCD\u5F62").asText(); // "词形"
        if (!word.isEmpty()) {
          variations.add(state.isEmpty() ? word : state + ": " + word);
        }
      }
    }
    return variations;
  }

  private List<String> parsePhrases(com.fasterxml.jackson.databind.JsonNode node) {
    List<String> phrases = new ArrayList<>();
    var arr = node.path("\u5E38\u89C1\u8BCD\u7EC4"); // "常见词组"
    if (arr.isArray()) {
      arr.forEach(
          p -> {
            if (p.isTextual()) {
              phrases.add(p.asText());
            }
          });
    }
    return phrases;
  }

  private void addFromNode(
      com.fasterxml.jackson.databind.JsonNode node, String field, List<String> target) {
    var arr = node.path(field);
    if (arr.isArray()) {
      arr.forEach(
          a -> {
            if (a.isTextual()) {
              target.add(a.asText());
            }
          });
    }
  }

  private Language parseLanguage(com.fasterxml.jackson.databind.JsonNode node, Language fallback) {
    String langStr = node.path("language").asText();
    if (langStr.isEmpty()) {
      langStr = node.path("\u8BED\u8A00").asText(); // "语言"
    }
    Language lang = fallback;
    if (!langStr.isEmpty()) {
      String upper = langStr.toUpperCase();
      if (upper.contains("CHINESE")) {
        lang = Language.CHINESE;
      } else if (upper.contains("ENGLISH")) {
        lang = Language.ENGLISH;
      } else {
        try {
          lang = Language.valueOf(upper);
        } catch (Exception ignored) {
        }
      }
    }
    return lang;
  }

  private String parseExample(
      com.fasterxml.jackson.databind.JsonNode node, List<String> englishDefs) {
    String example = node.path("example").isNull() ? null : node.path("example").asText();
    var defsNode = node.path("definitions");
    if ((example == null || example.isEmpty()) && defsNode.isArray()) {
      for (var def : defsNode) {
        var exNode = def.path("examples");
        if (exNode.isArray() && exNode.size() > 0) {
          example = exNode.get(0).asText();
          break;
        }
      }
    }
    if (example == null || example.isEmpty()) {
      var explainNode = node.path("\u53D1\u97F3\u89E3\u91CA"); // "发音解释"
      if (explainNode.isArray()) {
        for (var exp : explainNode) {
          var defList = exp.path("\u91CA\u4E49"); // "释义"
          if (defList.isArray()) {
            for (var d : defList) {
              var exNode = d.path("\u4F8B\u53E5"); // "例句"
              if (exNode.isArray() && exNode.size() > 0) {
                var first = exNode.get(0);
                if (first.has("\u6E90\u8BED\u8A00")) {
                  // "源语言"
                  example = first.path("\u6E90\u8BED\u8A00").asText();
                } else if (first.isTextual()) {
                  example = first.asText();
                }
                break;
              }
            }
          }
        }
      }
    }
    return example;
  }

  private String parsePhonetic(com.fasterxml.jackson.databind.JsonNode node) {
    String phonetic = node.path("phonetic").isNull() ? null : node.path("phonetic").asText();
    if (phonetic == null || phonetic.isEmpty()) {
      var pronNode = node.path("pronunciations");
      if (pronNode.isObject()) {
        var fieldNames = pronNode.fieldNames();
        if (fieldNames.hasNext()) {
          String firstKey = fieldNames.next();
          var value = pronNode.get(firstKey);
          if (value != null && !value.isNull()) {
            phonetic = value.asText();
          }
        }
      }
    }
    if (phonetic == null || phonetic.isEmpty()) {
      var pNode = node.path("\u53D1\u97F3"); // "发音"
      if (pNode.isObject()) {
        if (pNode.has("\u82F1\u97F3")) {
          phonetic = pNode.path("\u82F1\u97F3").asText();
        } else if (pNode.has("\u7F8E\u97F3")) {
          phonetic = pNode.path("\u7F8E\u97F3").asText();
        }
      }
    }
    return phonetic;
  }

  private String extractJson(String text) {
    String trimmed = text.trim();
    if (trimmed.startsWith("```")) {
      int firstNewline = trimmed.indexOf('\n');
      if (firstNewline != -1) {
        trimmed = trimmed.substring(firstNewline + 1);
      }
      int lastFence = trimmed.lastIndexOf("```");
      if (lastFence != -1) {
        trimmed = trimmed.substring(0, lastFence);
      }
    }
    int start = trimmed.indexOf('{');
    int end = trimmed.lastIndexOf('}');
    if (start != -1 && end != -1 && start < end) {
      trimmed = trimmed.substring(start, end + 1);
    }
    return trimmed.trim();
  }
}
