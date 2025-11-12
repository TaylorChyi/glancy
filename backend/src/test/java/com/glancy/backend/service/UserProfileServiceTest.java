package com.glancy.backend.service;

import com.glancy.backend.dto.ProfileCustomSectionDto;
import com.glancy.backend.dto.ProfileCustomSectionItemDto;
import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.repository.UserProfileRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
@TestPropertySource(
    properties = {
        "oss.access-key-id=test-access-key",
        "oss.access-key-secret=test-access-secret",
        "oss.bucket=test-bucket",
        "oss.verify-location=false",
    }
)
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
     * 测试目标：验证保存后再次读取画像时所有字段（含自定义大项）保持一致且默认 ID 被写入。
     * 前置条件：
     *  - 新增一个用户实体；
     *  - 使用包含职业、兴趣、目标、学历、能力与自定义大项的请求记录。
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

        List<ProfileCustomSectionDto> customSections = List.of(
            new ProfileCustomSectionDto("作品集", List.of(new ProfileCustomSectionItemDto("近期项目", "AI 口语教练")))
        );
        UserProfileRequest req = new UserProfileRequest(
            "dev",
            "code",
            "learn",
            "master",
            "B2",
            15,
            "exchange study",
            "沉稳而有条理",
            customSections
        );
        UserProfileResponse saved = userProfileService.saveProfile(user.getId(), req);

        Assertions.assertNotNull(saved.id());
        Assertions.assertEquals("dev", saved.job());
        Assertions.assertEquals("code", saved.interest());
        Assertions.assertEquals("master", saved.education());
        Assertions.assertEquals("B2", saved.currentAbility());
        Assertions.assertEquals("沉稳而有条理", saved.responseStyle());
        Assertions.assertEquals(1, saved.customSections().size());

        UserProfileResponse fetched = userProfileService.getProfile(user.getId());
        Assertions.assertEquals(saved.id(), fetched.id());
        Assertions.assertEquals(saved.job(), fetched.job());
        Assertions.assertEquals(user.getId(), fetched.userId());
        Assertions.assertEquals("master", fetched.education());
        Assertions.assertEquals(1, fetched.customSections().size());
        Assertions.assertEquals("沉稳而有条理", fetched.responseStyle());
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
        Assertions.assertNull(fetched.id());
        Assertions.assertNull(fetched.job());
        Assertions.assertEquals(user.getId(), fetched.userId());
        Assertions.assertTrue(fetched.customSections().isEmpty(), "custom sections should default to empty list");
        Assertions.assertNull(fetched.responseStyle());
    }
}
