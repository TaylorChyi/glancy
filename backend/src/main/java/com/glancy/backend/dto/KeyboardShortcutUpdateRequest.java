/**
 * 背景：
 *  - 更新快捷键时需校验传入的按键组合，避免空值污染存储。
 * 目的：
 *  - 使用不可变请求对象承载客户端提交的按键列表。
 * 关键决策与取舍：
 *  - 仅在请求体携带按键序列，其余上下文（如动作）通过路径变量传递，便于精细化校验。
 * 影响范围：
 *  - KeyboardShortcutController#updateShortcut 的请求体契约。
 * 演进与TODO：
 *  - TODO: 若未来支持一次更新多个动作，可扩展为批量列表。
 */
package com.glancy.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record KeyboardShortcutUpdateRequest(
    @NotNull @NotEmpty @Size(max = 4) List<@NotNull @Size(min = 1, max = 40) String> keys
) {}
