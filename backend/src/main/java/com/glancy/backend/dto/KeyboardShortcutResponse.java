/**
 * 背景：
 *  - 前端需要一次性获取全部快捷键绑定用于渲染设置页面。
 * 目的：
 *  - 封装快捷键列表，方便未来扩展分页或附加元数据。
 * 关键决策与取舍：
 *  - 不内嵌业务逻辑，仅提供数据容器；若未来字段增多，可拆分分页结构。
 * 影响范围：
 *  - 所有快捷键相关 API 返回该 DTO。
 * 演进与TODO：
 *  - TODO: 可追加 "updatedAt" 提示最近更新时间。
 */
package com.glancy.backend.dto;

import java.util.List;

public record KeyboardShortcutResponse(List<KeyboardShortcutView> shortcuts) {}
