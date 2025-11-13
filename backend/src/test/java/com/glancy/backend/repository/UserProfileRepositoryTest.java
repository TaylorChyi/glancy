package com.glancy.backend.repository;

import com.glancy.backend.entity.User;
import com.glancy.backend.entity.UserProfile;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class UserProfileRepositoryTest {

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * 测试目标：验证根据用户 ID 查询画像时返回工厂默认的职业与目标字段。 前置条件：通过工厂方法创建用户与画像。 步骤： 1) 保存用户与画像； 2) 调用 `findByUserId`。
     * 断言： - 查询结果存在； - 职业字段等于工厂设定的 "engineer"； - 每日词汇目标等于 30。 边界/异常：若不存在画像，应返回空 Optional（此用例未覆盖）。
     */
    @Test
    void findByUserId() {
        User user = userRepository.save(TestEntityFactory.user(60));
        UserProfile profile = TestEntityFactory.userProfile(user);
        userProfileRepository.save(profile);

        Optional<UserProfile> found = userProfileRepository.findByUserId(user.getId());
        Assertions.assertTrue(found.isPresent());
        Assertions.assertEquals("engineer", found.get().getJob());
        Assertions.assertEquals(30, found.get().getDailyWordTarget());
    }
}
