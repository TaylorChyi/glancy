package com.glancy.backend.entity.redemption;

import com.glancy.backend.entity.BaseEntity;
import com.glancy.backend.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/**
 * 背景：
 *  - 为了控制每个用户的兑换次数，需要精确记录每次兑换事件。
 * 目的：
 *  - 存档用户与兑换码的关联及兑换时间，便于统计与限流。
 * 关键决策与取舍：
 *  - 采用多对一关联至用户和兑换码，避免冗余字段；若未来存在脱敏需求，可迁移至事件流。\
 *  - 不引入软删除以外的额外状态，由上层通过 deleted 字段控制可见性。
 * 影响范围：
 *  - 兑换逻辑的次数统计依赖该记录。
 * 演进与TODO：
 *  - 可追加来源渠道、设备信息等，以支持风控分析。
 */
@Entity
@Table(name = "redemption_record")
public class RedemptionRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "code_id", nullable = false)
    private RedemptionCode code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime redeemedAt;

    public RedemptionCode getCode() {
        return code;
    }

    public void setCode(RedemptionCode code) {
        this.code = code;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getRedeemedAt() {
        return redeemedAt;
    }

    public void setRedeemedAt(LocalDateTime redeemedAt) {
        this.redeemedAt = redeemedAt;
    }
}
