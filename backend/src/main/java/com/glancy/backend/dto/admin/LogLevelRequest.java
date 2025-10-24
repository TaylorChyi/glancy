/**
 * 背景：
 *  - 日志级别调整请求与业务 DTO 同目录，运维配置领域缺少聚合。
 * 目的：
 *  - 在 admin 包封装运行时日志级别调整输入，服务运维接口。
 * 关键决策与取舍：
 *  - 保持简单字段并依赖 Bean Validation，复杂校验交由服务层。
 * 影响范围：
 *  - 运行时日志管理接口导入路径更新。
 * 演进与TODO：
 *  - 若支持批量调整，可在本包扩展集合请求。
 */
package com.glancy.backend.dto.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body for changing the log level of a logger at runtime.
 */
@Data
public class LogLevelRequest {

    @NotBlank(message = "{validation.logLevel.logger.notblank}")
    private String logger;

    @NotBlank(message = "{validation.logLevel.level.notblank}")
    private String level;
}
