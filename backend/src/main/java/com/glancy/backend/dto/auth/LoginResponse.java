/**
 * 背景：
 *  - 登录响应数据此前与其他用户领域 DTO 混放，定位身份认证返回体效率低。
 * 目的：
 *  - 在 auth 包内集中输出登录响应结构，确保鉴权上下文语义一致。
 * 关键决策与取舍：
 *  - 维持简单数据载体，不在 DTO 中引入业务逻辑，认证策略由服务层承担。
 * 影响范围：
 *  - 登录相关 Controller/Service 的导入需调整至 auth 子包。
 * 演进与TODO：
 *  - 未来若引入刷新令牌，可在此扩展字段并保持包内聚合。
 */
package com.glancy.backend.dto.auth;

import com.glancy.backend.entity.MembershipType;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Data returned to the client upon successful login.
 */
@Data
@AllArgsConstructor
public class LoginResponse {

    private Long id;
    private String username;
    private String email;
    private String avatar;
    private String phone;
    private Boolean member;
    /** 当前会员等级，非会员返回 {@code NONE}。 */
    private MembershipType membershipType;
    /** 会员有效期，UTC 时间；无期限会员返回 {@code null}。 */
    private LocalDateTime membershipExpiresAt;
    private String token;
}
