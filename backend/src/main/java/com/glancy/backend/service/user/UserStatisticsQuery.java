package com.glancy.backend.service.user;

import com.glancy.backend.dto.UserStatisticsResponse;
import com.glancy.backend.repository.UserRepository;
import java.time.Clock;
import java.time.LocalDateTime;
import org.springframework.stereotype.Component;

@Component
public class UserStatisticsQuery {

    private final UserRepository userRepository;
    private final Clock clock;

    public UserStatisticsQuery(UserRepository userRepository, Clock clock) {
        this.userRepository = userRepository;
        this.clock = clock;
    }

    /** 意图：统计用户总体、会员、注销数量。 */
    public UserStatisticsResponse getStatistics() {
        long total = userRepository.count();
        long deleted = userRepository.countByDeletedTrue();
        long members = userRepository.countActiveMembers(LocalDateTime.now(clock));
        return new UserStatisticsResponse(total, members, deleted);
    }

    /** 意图：统计活跃用户数量。 */
    public long countActiveUsers() {
        return userRepository.countByDeletedFalse();
    }
}
