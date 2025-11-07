package com.glancy.backend.llm.prompt;

import com.glancy.backend.llm.service.WordPromptTemplate;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;

/**
 * 背景：
 *  - 词典检索需要在运行时将模板文件与动态上下文合成模型指令，避免硬编码拼接带来的维护负担。
 * 目的：
 *  - 负责在内存中渲染 Prompt 模板内容，并以占位符渲染方式返回最终字符串供调用方使用。
 * 关键决策与取舍：
 *  - 使用最小正则替换实现 {{key}} 占位符注入，避免额外引入模板引擎依赖。
 *  - 模板内容通过常量注入，不再依赖磁盘 IO，从而规避缓存与资源定位复杂度。
 * 影响范围：
 *  - 所有需要渲染模板的组件可注入本渲染器，获取统一的模板装配能力。
 * 演进与TODO：
 *  - 后续可扩展条件语法或国际化支持，或替换为功能更强的模板引擎。
 */
@Component
public class PromptTemplateRenderer {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{(.*?)\\}}", Pattern.DOTALL);

    public String render(WordPromptTemplate template, Map<String, String> context) {
        Assert.notNull(template, "template must not be null");
        return render(template.content(), context);
    }

    public String render(String templateContent, Map<String, String> context) {
        Assert.hasText(templateContent, "templateContent must not be empty");
        Map<String, String> safeContext = context == null ? Map.of() : context;
        String template = templateContent;
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
        StringBuffer buffer = new StringBuffer();
        while (matcher.find()) {
            String key = matcher.group(1).trim();
            String replacement = safeContext.getOrDefault(key, "");
            matcher.appendReplacement(buffer, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(buffer);
        return buffer.toString();
    }
}
