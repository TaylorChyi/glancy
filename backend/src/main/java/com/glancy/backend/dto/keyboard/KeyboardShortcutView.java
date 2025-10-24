/**
 * 背景：
 *  - 快捷键视图既需向前端返回当前绑定与默认值，也应从目录结构上体现设置领域；
 *    先前与其他 DTO 扁平共存导致语义模糊。
 * 目的：
 *  - 在 keyboard 包提供单个快捷键动作的不可变描述，方便展示与重置提示。
 * 关键决策与取舍：
 *  - 采用 record 保持只读语义，字段仅承载数据不含逻辑。
 * 影响范围：
 *  - KeyboardShortcutController 的响应体结构导入路径更新。
 * 演进与TODO：
 *  - TODO: 若未来补充快捷键分组，可引入 groupId 字段。
 */
package com.glancy.backend.dto.keyboard;

import java.util.List;

public record KeyboardShortcutView(String action, List<String> keys, List<String> defaultKeys) {}
