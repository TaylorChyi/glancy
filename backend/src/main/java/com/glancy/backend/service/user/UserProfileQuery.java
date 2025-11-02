package com.glancy.backend.service.user;

import com.glancy.backend.dto.UserDetailResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - UserService 既承担查询又负责命令处理，导致文件体积与耦合度过高。
 * 目的：
 *  - 通过查询处理器（Query Handler）解耦读操作，复用装配器生成 DTO。
 * 关键决策与取舍：
 *  - 保留日志以提升可观测性；
 *  - 以组合方式复用 {@link UserResponseAssembler}，避免重复代码。
 * 影响范围：
 *  - 用户详情、原始实体查询逻辑迁移至此组件。
 * 演进与TODO：
 *  - 后续可加入缓存或只读快照以提升性能。
 */
@Component
public class UserProfileQuery {

    private static final Logger log = LoggerFactory.getLogger(UserProfileQuery.class);

    private final UserRepository userRepository;
    private final UserResponseAssembler responseAssembler;

    public UserProfileQuery(UserRepository userRepository, UserResponseAssembler responseAssembler) {
        this.userRepository = userRepository;
        this.responseAssembler = responseAssembler;
    }

    /**
     * 意图：查询原始用户实体。
     */
    public User getUserRaw(Long id) {
        log.info("Fetching user {}", id);
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }

    /**
     * 意图：查询用户详情并封装为 DTO。
     */
    public UserDetailResponse getUserDetail(Long id) {
        User user = getUserRaw(id);
        return responseAssembler.toUserDetail(user);
    }
}
