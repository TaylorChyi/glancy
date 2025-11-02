package com.glancy.backend.service.user;

import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.exception.ResourceNotFoundException;
import com.glancy.backend.repository.UserRepository;
import com.glancy.backend.service.AvatarStorage;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * 背景：
 *  - 头像上传与地址转换逻辑在 UserService 中占据较多篇幅且耦合度高。
 * 目的：
 *  - 通过命令对象封装头像变更流程，并复用 {@link UserDataSanitizer} 保证数据一致性。
 * 关键决策与取舍：
 *  - 维持细粒度职责，避免在其它命令中重复上传逻辑；
 *  - 保留错误语义与日志以便快速定位存储异常。
 * 影响范围：
 *  - 头像读取、更新、上传流程迁移至此组件。
 * 演进与TODO：
 *  - 后续可扩展多尺寸裁剪或头像审核策略。
 */
@Component
public class UserAvatarCommand {

    private static final Logger log = LoggerFactory.getLogger(UserAvatarCommand.class);

    private final UserRepository userRepository;
    private final AvatarStorage avatarStorage;
    private final UserDataSanitizer dataSanitizer;
    private final UserResponseAssembler responseAssembler;

    public UserAvatarCommand(
        UserRepository userRepository,
        AvatarStorage avatarStorage,
        UserDataSanitizer dataSanitizer,
        UserResponseAssembler responseAssembler
    ) {
        this.userRepository = userRepository;
        this.avatarStorage = avatarStorage;
        this.dataSanitizer = dataSanitizer;
        this.responseAssembler = responseAssembler;
    }

    /**
     * 意图：读取用户头像并转换成外部可访问链接。
     */
    public AvatarResponse getAvatar(Long userId) {
        log.info("Fetching avatar for user {}", userId);
        User user = loadUser(userId);
        return responseAssembler.toAvatarResponse(user.getAvatar());
    }

    /**
     * 意图：更新用户头像引用。
     */
    public AvatarResponse updateAvatar(Long userId, String avatarReference) {
        log.info("Updating avatar for user {}", userId);
        User user = loadUser(userId);
        String objectKey = dataSanitizer.requireObjectKey(avatarReference);
        String previousAvatar = user.getAvatar();
        user.setAvatar(objectKey);
        User saved = userRepository.save(user);
        log.info("Avatar updated for user {} from {} to {}", userId, previousAvatar, saved.getAvatar());
        return responseAssembler.toAvatarResponse(saved.getAvatar());
    }

    /**
     * 意图：上传头像文件并更新引用。
     */
    public AvatarResponse uploadAvatar(Long userId, MultipartFile file) {
        try {
            String objectKey = avatarStorage.upload(file);
            return updateAvatar(userId, objectKey);
        } catch (IOException e) {
            log.error("Failed to upload avatar", e);
            throw new InvalidRequestException("上传头像失败");
        }
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
    }
}
