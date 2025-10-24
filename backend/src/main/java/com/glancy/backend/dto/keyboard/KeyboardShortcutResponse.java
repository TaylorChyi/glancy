/**
 * 背景：
 *  - 快捷键响应此前与其他 DTO 扁平共存，设置领域语义不清；前端需要一次性载入全部配置。
 * 目的：
 *  - 在 keyboard 包封装快捷键列表，支撑设置页渲染并便于后续扩展分页或元数据。
 * 关键决策与取舍：
 *  - 采用 record 保持只读容器，业务逻辑留在服务层；如字段增多可考虑分页 DTO。
 * 影响范围：
 *  - 快捷键 API 导入路径更新。
 * 演进与TODO：
 *  - TODO: 可追加 "updatedAt" 提示最近更新时间。
 */
package com.glancy.backend.dto.keyboard;

import java.util.List;

public record KeyboardShortcutResponse(List<KeyboardShortcutView> shortcuts) {}
