package com.glancy.backend.llm.llm;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - 多个词典模型客户端以 Spring Bean 形式注册，需要统一的查找工厂屏蔽容器细节。
 * 目的：
 *  - 基于名称索引具体的 {@link DictionaryModelClient} 实例，支持运行时按配置切换模型。
 * 关键决策与取舍：
 *  - 采用不可变快照 Map 存储注册信息，避免外部修改带来线程安全风险。
 * 影响范围：
 *  - 搜索服务与配置模块通过该工厂选择词典模型客户端。
 * 演进与TODO：
 *  - 后续可在此加入特性开关或健康检查逻辑，动态过滤不可用客户端。
 */
@Component
public class DictionaryModelClientFactory {

    private final Map<String, DictionaryModelClient> clientMap = new HashMap<>();

    public DictionaryModelClientFactory(List<DictionaryModelClient> clients) {
        for (DictionaryModelClient client : clients) {
            clientMap.put(client.name(), client);
        }
    }

    public DictionaryModelClient get(String name) {
        return clientMap.get(name);
    }

    /**
     * 返回所有已注册客户端的名称，便于控制台或测试探测可选模型。
     */
    public List<String> getClientNames() {
        List<String> names = new ArrayList<>(clientMap.keySet());
        Collections.sort(names);
        return names;
    }
}
