/**
 * 背景：
 *  - 通用错误响应此前散落在扁平 DTO 目录，跨领域调用难以统一引用。
 * 目的：
 *  - 在 common 包集中维护标准错误响应，供全局异常处理复用。
 * 关键决策与取舍：
 *  - 保持简洁数据载体，错误语义由异常处理器负责；包划分强调跨领域复用。
 * 影响范围：
 *  - GlobalExceptionHandler 等导入路径更新。
 * 演进与TODO：
 *  - 若需返回错误码或追踪号，可在本包扩展字段。
 */
package com.glancy.backend.dto.common;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Simple error response body.
 */
@Data
@AllArgsConstructor
public class ErrorResponse {

    private String message;
}
