package com.glancy.backend.llm.prompt;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.util.StreamUtils;

/**
 * 背景：
 *  - 词典检索需要在运行时将模板文件与动态上下文合成模型指令，避免硬编码拼接带来的维护负担。
 * 目的：
 *  - 负责加载并缓存 Prompt 模板内容，并以占位符渲染方式返回最终字符串供调用方使用。
 * 关键决策与取舍：
 *  - 使用最小正则替换实现 {{key}} 占位符注入，避免额外引入模板引擎依赖。
 *  - 通过 ConcurrentHashMap 缓存模板内容，平衡内存开销与重复 IO 成本。
 * 影响范围：
 *  - 所有需要渲染模板的组件可注入本渲染器，获取统一的模板装配能力。
 * 演进与TODO：
 *  - 后续可扩展条件语法或国际化支持，或替换为功能更强的模板引擎。
 */
@Component
public class PromptTemplateRenderer {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{(.*?)\\}}", Pattern.DOTALL);

    private final ResourceLoader resourceLoader;
    private final Map<String, String> templateCache = new ConcurrentHashMap<>();

    public PromptTemplateRenderer(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public String render(String resourcePath, Map<String, String> context) {
        Assert.hasText(resourcePath, "resourcePath must not be empty");
        String template = templateCache.computeIfAbsent(resourcePath, this::loadTemplate);
        Map<String, String> safeContext = context == null ? Collections.emptyMap() : context;
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

    public void preload(Collection<String> resourcePaths) {
        if (resourcePaths == null) {
            return;
        }
        for (String path : resourcePaths) {
            if (path != null && !path.isBlank()) {
                templateCache.computeIfAbsent(path, this::loadTemplate);
            }
        }
    }

    private String loadTemplate(String resourcePath) {
        try {
            Resource resource = resourceLoader.getResource("classpath:" + resourcePath);
            if (!resource.exists()) {
                throw new IllegalArgumentException("Template resource missing: " + resourcePath);
            }
            return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load template: " + resourcePath, ex);
        }
    }
}
