package com.glancy.backend.llm.search;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.function.UnaryOperator;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - LLM 查询及缓存命中依赖统一的词条归一化策略，历史实现仅做简单大小写转换，无法过滤标点与多余空白。\
 * 目的：
 *  - 通过流水线式处理清理 Unicode、空白与噪声标点，保证请求、缓存和模型输入对齐。\
 * 关键决策与取舍：
 *  - 采用责任链式的函数列表以便按需扩展或重排规则，相比逐段硬编码更易于维护。\
 * 影响范围：
 *  - SearchContentManager 的所有调用方（含服务缓存与 LLM 请求）将获得一致的归一化结果。\
 * 演进与TODO：
 *  - 如需语言特定处理，可在 PIPELINE 中注入策略或引入多实现。
 */
@Component
public class SearchContentManagerImpl implements SearchContentManager {

    // 采用职责分层的归一化流水线，便于后续按需扩展规则（例如按语言插入新步骤）。
    private static final List<UnaryOperator<String>> PIPELINE = List.of(
        String::trim,
        SearchContentManagerImpl::normalizeUnicode,
        SearchContentManagerImpl::collapseWhitespace,
        SearchContentManagerImpl::stripPunctuation,
        value -> value.toLowerCase(Locale.ROOT)
    );

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
