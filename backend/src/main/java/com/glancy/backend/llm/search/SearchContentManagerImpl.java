package com.glancy.backend.llm.search;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.function.UnaryOperator;
import org.springframework.stereotype.Component;

@Component
public class SearchContentManagerImpl implements SearchContentManager {

  // 采用职责分层的归一化流水线，便于后续按需扩展规则（例如按语言插入新步骤）。
  private static final List<UnaryOperator<String>> PIPELINE =
      List.of(
          String::trim,
          SearchContentManagerImpl::normalizeUnicode,
          SearchContentManagerImpl::collapseWhitespace,
          SearchContentManagerImpl::stripPunctuation,
          value -> value.toLowerCase(Locale.ROOT));

  @Override
  public String normalize(String input) {
    if (input == null) {
      return "";
    }
    String current = input;
    for (UnaryOperator<String> step : PIPELINE) {
      current = step.apply(current);
    }
    return current;
  }

  private static String normalizeUnicode(String value) {
    return Normalizer.normalize(value, Normalizer.Form.NFKC);
  }

  private static String collapseWhitespace(String value) {
    StringBuilder builder = new StringBuilder(value.length());
    boolean previousWhitespace = false;
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      if (Character.isWhitespace(ch)) {
        if (!previousWhitespace) {
          builder.append(' ');
        }
        previousWhitespace = true;
      } else {
        builder.append(ch);
        previousWhitespace = false;
      }
    }
    return builder.toString().strip();
  }

  private static String stripPunctuation(String value) {
    StringBuilder builder = new StringBuilder(value.length());
    for (int i = 0; i < value.length(); i++) {
      char ch = value.charAt(i);
      if (Character.isLetterOrDigit(ch) || Character.isIdeographic(ch)) {
        builder.append(ch);
        continue;
      }
      if (Character.isWhitespace(ch)) {
        builder.append(ch);
        continue;
      }
      if (ch == '\'' || ch == '-' || ch == '·') {
        builder.append(ch);
      }
    }
    return builder.toString();
  }
}
