/**
 * 背景：
 *  - 登录标识解析工具此前散落在扁平 DTO 目录，责任边界与用户资料等模型混淆。
 * 目的：
 *  - 将登录标识封装归档至 auth 包，明确其专属身份认证场景职责。
 * 关键决策与取舍：
 *  - 维持轻量静态解析逻辑以避免引入额外服务依赖，未来可抽象策略模式扩展规则。
 * 影响范围：
 *  - UserService 等调用者导入路径需要更新。
 * 演进与TODO：
 *  - 计划在支持企业账号或多租户时扩展 Type 枚举并引入配置化解析。
 */
package com.glancy.backend.dto.auth;

import lombok.Data;

/**
 * Encapsulates the login identifier text and its resolved type.
 */
@Data
public class LoginIdentifier {

    /**
     * Supported identifier types.
     */
    public enum Type {
        USERNAME,
        EMAIL,
        PHONE,
    }

    /** Identifier type, may be null if not provided. */
    private Type type;

    /** Raw identifier text entered by the user. */
    private String text;

    /**
     * Attempt to resolve the identifier type from the raw text.
     *
     * @param raw the raw identifier text
     * @return the detected type or USERNAME as default
     */
    public static Type resolveType(String raw) {
        if (raw == null) {
            return null;
        }
        if (raw.contains("@") && raw.contains(".")) {
            return Type.EMAIL;
        }
        if (raw.matches("^\\+?\\d+$")) {
            return Type.PHONE;
        }
        return Type.USERNAME;
    }
}
