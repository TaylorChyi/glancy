package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import com.glancy.backend.dto.ProfileSectionDto;
import com.glancy.backend.dto.ProfileSectionItemDto;
import com.glancy.backend.dto.UserProfileRequest;
import com.glancy.backend.dto.UserProfileResponse;
import com.glancy.backend.entity.User;
import com.glancy.backend.repository.UserProfileRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
    properties = {
        "oss.endpoint=http://localhost",
        "oss.bucket=test-bucket",
        "oss.access-key-id=dummy",
        "oss.access-key-secret=dummy",
        "oss.verify-location=false"
    }
)
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
     * 测试目标：验证保存后再次读取画像时学历、职业、兴趣、目标、当前能力与自定义区块保持一致。
     * 前置条件：
     *  - 新增一个用户实体；
     *  - 请求记录包含学历、职业、兴趣、目标、当前能力与单个自定义区块。
     * 步骤：
     *  1) 调用 `saveProfile` 持久化请求；
     *  2) 调用 `getProfile` 再次读取；
     *  3) 对比两次响应的关键字段和值。
     * 断言：
     *  - 保存响应包含非空 ID；
     *  - 读取响应与保存响应字段一致；
     *  - 自定义区块的标识与值未丢失。
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

        UserProfileRequest req = new UserProfileRequest(
            "本科",
            "dev",
            "code",
            "learn",
            "B2",
            15,
            "exchange study",
            List.of(
                new ProfileSectionDto(
                    "learning-plan",
                    "学习计划",
                    List.of(new ProfileSectionItemDto("milestone", "里程碑", "完成 100 词"))
                )
            )
        );
        UserProfileResponse saved = userProfileService.saveProfile(user.getId(), req);

        assertNotNull(saved.id());
        assertEquals("本科", saved.education());
        assertEquals("dev", saved.job());
        assertEquals("code", saved.interest());
        assertEquals("B2", saved.currentAbility());
        assertEquals(1, saved.customSections().size());
        assertEquals("learning-plan", saved.customSections().get(0).id());
        assertEquals("milestone", saved.customSections().get(0).items().get(0).id());

        UserProfileResponse fetched = userProfileService.getProfile(user.getId());
        assertEquals(saved.id(), fetched.id());
        assertEquals(saved.job(), fetched.job());
        assertEquals(user.getId(), fetched.userId());
        assertEquals("本科", fetched.education());
        assertEquals("B2", fetched.currentAbility());
        assertEquals(1, fetched.customSections().size());
        assertEquals("完成 100 词", fetched.customSections().get(0).items().get(0).value());
    }

    /**
     * 测试目标：当画像不存在时返回携带用户 ID 的默认响应。
     * 前置条件：仅创建用户实体，不写入画像记录。
     * 步骤：直接调用 `getProfile`。
     * 断言：
     *  - 响应 ID 为空；
     *  - userId 等于请求的用户主键；
     *  - 画像文本字段为 null；
     *  - 自定义区块返回空集合。
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
        assertNull(fetched.education());
        assertTrue(fetched.customSections().isEmpty());
        assertEquals(user.getId(), fetched.userId());
    }
}
