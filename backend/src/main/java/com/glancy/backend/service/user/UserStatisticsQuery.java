package com.glancy.backend.service.user;

import com.glancy.backend.dto.UserStatisticsResponse;
import com.glancy.backend.repository.UserRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - 用户统计与其它业务逻辑混杂在一个服务中，不利于后续度量扩展。
 * 目的：
 *  - 以查询对象形式集中统计相关逻辑，便于未来注入指标采集。
 * 关键决策与取舍：
 *  - 注入 Clock 以支持可测与时区一致性；
 *  - 查询类保持无状态，方便缓存。
 * 影响范围：
 *  - 用户统计接口改由该类提供。
 * 演进与TODO：
 *  - 可引入聚合缓存或指标上报以降低数据库压力。
 */
@Component
public class UserStatisticsQuery {

    private final UserRepository userRepository;
    private final Clock clock;

    public UserStatisticsQuery(UserRepository userRepository, Clock clock) {
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /**
     * 意图：统计用户总体、会员、注销数量。
     */
    public UserStatisticsResponse getStatistics() {
        long total = userRepository.count();
        long deleted = userRepository.countByDeletedTrue();
        long members = userRepository.countActiveMembers(LocalDateTime.now(clock));
        return new UserStatisticsResponse(total, members, deleted);
    }

    /**
     * 意图：统计活跃用户数量。
     */
    public long countActiveUsers() {
        return userRepository.countByDeletedFalse();
    }
}
