/**
 * 背景：
 *  - 快捷键之前以硬编码方式散落在前端，缺少后端建模导致无法持久化与冲突检测。
 * 目的：
 *  - 通过枚举声明受支持的快捷键动作及其默认按键组合，为服务层提供统一蓝本。
 * 关键决策与取舍：
 *  - 采用枚举并嵌入默认组合，便于未来扩展更多动作时维持集中管理；避免将默认值写入数据库以降低迁移成本。
 * 影响范围：
 *  - 用户快捷键持久化与 API 响应依赖该蓝本生成数据。
 * 演进与TODO：
 *  - TODO: 若未来支持用户自定义动作，可引入元数据表改写为配置驱动。
 */
package com.glancy.backend.entity;

import java.util.Collections;
import java.util.List;

public enum ShortcutAction {
    FOCUS_SEARCH(List.of("MOD", "SHIFT", "F")),
    SWITCH_LANGUAGE(List.of("MOD", "SHIFT", "L")),
    TOGGLE_THEME(List.of("MOD", "SHIFT", "M")),
    TOGGLE_FAVORITE(List.of("MOD", "SHIFT", "B")),
    OPEN_SHORTCUTS(List.of("MOD", "SHIFT", "K"));

    private final List<String> defaultKeys;

    ShortcutAction(List<String> defaultKeys) {
        this.defaultKeys = List.copyOf(defaultKeys);
    }

    public List<String> getDefaultKeys() {
        return Collections.unmodifiableList(defaultKeys);
    }
}
