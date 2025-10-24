/**
 * 背景：
 *  - 用户基础响应长期位于扁平 DTO 目录，与认证返回混杂，定位困难。
 * 目的：
 *  - 将常用用户响应归档至 user 包，统一用户资料访问视图。
 * 关键决策与取舍：
 *  - 保持简单数据载体并依赖 Lombok 生成访问器，避免在 DTO 层嵌入逻辑。
 * 影响范围：
 *  - 多数用户查询接口导入路径迁移至 user 子包。
 * 演进与TODO：
 *  - 若后续需要更多状态字段，可在本包保持聚合并引入版本化策略。
 */
package com.glancy.backend.dto.user;

import com.glancy.backend.entity.MembershipType;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Basic user information returned by many endpoints.
 */
@Data
@AllArgsConstructor
public class UserResponse {

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
}
