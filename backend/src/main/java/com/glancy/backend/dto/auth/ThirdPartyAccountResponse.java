/**
 * 背景：
 *  - 第三方账号绑定响应位于扁平目录，难以与用户资料返回区分。
 * 目的：
 *  - 在 auth 包聚合第三方鉴权响应模型，确保认证相关返回体集中管理。
 * 关键决策与取舍：
 *  - 不在 DTO 中引入状态判断，授权生命周期仍由服务策略控制。
 * 影响范围：
 *  - 第三方绑定 API 的导入路径同步迁移至 auth 子包。
 * 演进与TODO：
 *  - 支持解绑或多账号时，可在本包添加集合响应或状态字段。
 */
package com.glancy.backend.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Information about a successfully bound third-party account.
 */
@Data
@AllArgsConstructor
public class ThirdPartyAccountResponse {

    private Long id;
    private String provider;
    private String externalId;
    private Long userId;
}
