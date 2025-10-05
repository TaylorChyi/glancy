/**
 * 背景：
 *  - API 需要向前端返回当前快捷键绑定及默认值，便于界面展示和重置提示。
 * 目的：
 *  - 用不可变 DTO 描述单个快捷键动作的绑定信息。
 * 关键决策与取舍：
 *  - 采用 record 提升可读性，并保证响应结构明确；字段仅承载数据不含逻辑。
 * 影响范围：
 *  - KeyboardShortcutController 的响应体结构依赖该 DTO。
 * 演进与TODO：
 *  - TODO: 若未来补充快捷键分组，可引入 groupId 字段。
 */
package com.glancy.backend.dto;

import java.util.List;

public record KeyboardShortcutView(String action, List<String> keys, List<String> defaultKeys) {}
