package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.repository.UserProfileRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class UserProfileServiceTest {

    @Autowired
    private UserProfileService userProfileService;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeAll
    static void loadEnv() {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String dbPassword = dotenv.get("DB_PASSWORD");
        if (dbPassword != null) {
            System.setProperty("DB_PASSWORD", dbPassword);
        }
    }

    @BeforeEach
    void setUp() {
        userProfileRepository.deleteAll();
        userRepository.deleteAll();
    }

    /**
     * 测试目标：验证保存后再次读取画像时字段保持一致且默认 ID 被写入。
     * 前置条件：
     *  - 新增一个用户实体；
     *  - 使用包含职业、兴趣、目标与学习计划的请求记录。
     * 步骤：
     *  1) 调用 `saveProfile` 持久化请求；
     *  2) 调用 `getProfile` 再次读取；
     *  3) 对比两次响应。
     * 断言：
     *  - 保存响应包含非空 ID；
     *  - 读取响应与保存响应字段一致；
     *  - 用户 ID 一致。
     * 边界/异常：
     *  - 若请求字段为空，实体应保存 null 并在读取时回传（此用例未覆盖）。
     */
    @Test
    void testSaveAndGetProfile() {
        User user = new User();
        user.setUsername("profileuser");
        user.setPassword("pass");
        user.setEmail("profile@example.com");
        user.setPhone("111");
        userRepository.save(user);

        UserProfileRequest req = new UserProfileRequest("dev", "code", "learn", 15, "exchange study");
        UserProfileResponse saved = userProfileService.saveProfile(user.getId(), req);

        assertNotNull(saved.id());
        assertEquals("dev", saved.job());
        assertEquals("code", saved.interest());

        UserProfileResponse fetched = userProfileService.getProfile(user.getId());
        assertEquals(saved.id(), fetched.id());
        assertEquals(saved.job(), fetched.job());
        assertEquals(user.getId(), fetched.userId());
    }

    /**
     * 测试目标：当画像不存在时返回携带用户 ID 的默认响应。
     * 前置条件：仅创建用户实体，不写入画像记录。
     * 步骤：直接调用 `getProfile`。
     * 断言：
     *  - 响应 ID 为空；
     *  - userId 等于请求的用户主键；
     *  - 画像文本字段为 null。
     * 边界/异常：若后续提供默认占位文案，应在服务层集中处理（当前保持 null）。
     */
    @Test
    void testDefaultProfileWhenMissing() {
        User user = new User();
        user.setUsername("p2");
        user.setPassword("pass");
        user.setEmail("p2@example.com");
        user.setPhone("112");
        userRepository.save(user);

        UserProfileResponse fetched = userProfileService.getProfile(user.getId());
        assertNull(fetched.id());
        assertNull(fetched.job());
        assertEquals(user.getId(), fetched.userId());
    }
}
