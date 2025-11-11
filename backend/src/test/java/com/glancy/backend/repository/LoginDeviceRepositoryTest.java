package com.glancy.backend.repository;
import org.junit.jupiter.api.Assertions;
import com.glancy.backend.entity.LoginDevice;
import com.glancy.backend.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

@DataJpaTest
class LoginDeviceRepositoryTest {

    @Autowired
    private LoginDeviceRepository loginDeviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUserIdOrderByLoginTimeAsc() {
        User user = userRepository.save(TestEntityFactory.user(30));
        LoginDevice d1 = TestEntityFactory.loginDevice(user, "d1", LocalDateTime.now());
        LoginDevice d2 = TestEntityFactory.loginDevice(user, "d2", LocalDateTime.now().plusMinutes(1));
        loginDeviceRepository.save(d2);
        loginDeviceRepository.save(d1);

        List<LoginDevice> list = loginDeviceRepository.findByUserIdOrderByLoginTimeAsc(user.getId());
        Assertions.assertEquals("d1", list.get(0).getDeviceInfo());
        Assertions.assertEquals(2, list.size());
    }
}
