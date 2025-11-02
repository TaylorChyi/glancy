/**
 * 背景：
 *  - 快捷键更新请求此前与其他 DTO 扁平共存，且需确保按键组合合法避免污染存储。
 * 目的：
 *  - 在 keyboard 包内提供不可变请求对象，承载客户端提交的按键列表。
 * 关键决策与取舍：
 *  - 仅在请求体携带按键序列，其余上下文通过路径变量传递，便于精细化校验并保持扩展性。
 * 影响范围：
 *  - KeyboardShortcutController#updateShortcut 的导入路径更新。
 * 演进与TODO：
 *  - TODO: 若未来支持一次更新多个动作，可扩展为批量列表。
 */
package com.glancy.backend.dto.keyboard;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record KeyboardShortcutUpdateRequest(
    @NotNull @NotEmpty @Size(max = 4) List<@NotNull @Size(min = 1, max = 40) String> keys
) {}
