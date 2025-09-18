package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.UserContactResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.LoginDevice;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.repository.LoginDeviceRepository;
import com.glancy.backend.repository.UserProfileRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@SpringBootTest
@Transactional
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoginDeviceRepository loginDeviceRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @MockitoBean
    private AvatarStorage avatarStorage;

    @BeforeAll
    static void loadEnv() {
        Dotenv dotenv = Dotenv.configure()
            .ignoreIfMissing() // 如果没有 .env 文件也不报错
            .load();

        String dbPassword = dotenv.get("DB_PASSWORD");
        if (dbPassword != null) {
            System.setProperty("DB_PASSWORD", dbPassword);
        }
    }

    @BeforeEach
    void setUp() {
        loginDeviceRepository.deleteAll();
        userRepository.deleteAll();
    }

    /**
     * 测试 testRegisterAndDeleteUser 接口
     */
    @Test
    void testRegisterAndDeleteUser() {
        System.out.println("========================DB_PASSWORD is null. Please check your .env file.");

        // 注册
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("testuser");
        req.setPassword("pass123");
        req.setEmail("test@example.com");
        req.setPhone("100");
        UserResponse resp = userService.register(req);

        assertNotNull(resp.getId());
        assertEquals("testuser", resp.getUsername());

        // 验证数据库中未删除
        User user = userRepository.findById(resp.getId()).orElseThrow();
        assertFalse(user.getDeleted());

        // 注销
        userService.deleteUser(resp.getId());
        User deletedUser = userRepository.findById(resp.getId()).orElseThrow();
        assertTrue(deletedUser.getDeleted());
    }

    /**
     * 测试 testRegisterDuplicateUsername 接口
     */
    @Test
    void testRegisterDuplicateUsername() {
        // 准备一条用户
        UserRegistrationRequest req1 = new UserRegistrationRequest();
        req1.setUsername("user1");
        req1.setPassword("pass123");
        req1.setEmail("a@example.com");
        req1.setPhone("101");
        userService.register(req1);

        // 再次用相同用户名
        UserRegistrationRequest req2 = new UserRegistrationRequest();
        req2.setUsername("user1");
        req2.setPassword("pass456");
        req2.setEmail("b@example.com");
        req2.setPhone("102");

        Exception ex = assertThrows(DuplicateResourceException.class, () -> {
            userService.register(req2);
        });
        assertEquals("用户名已存在", ex.getMessage());
    }

    /**
     * 测试 testRegisterDuplicateEmail 接口
     */
    @Test
    void testRegisterDuplicateEmail() {
        // 准备一条用户
        UserRegistrationRequest req1 = new UserRegistrationRequest();
        req1.setUsername("user1");
        req1.setPassword("pass123");
        req1.setEmail("a@example.com");
        req1.setPhone("111");
        userService.register(req1);

        // 再次用相同邮箱
        UserRegistrationRequest req2 = new UserRegistrationRequest();
        req2.setUsername("user2");
        req2.setPassword("pass456");
        req2.setEmail("a@example.com");
        req2.setPhone("112");

        Exception ex = assertThrows(DuplicateResourceException.class, () -> {
            userService.register(req2);
        });
        assertEquals("邮箱已被使用", ex.getMessage());
    }

    /**
     * 测试 testRegisterDuplicatePhone 接口
     */
    @Test
    void testRegisterDuplicatePhone() {
        UserRegistrationRequest req1 = new UserRegistrationRequest();
        req1.setUsername("userp1");
        req1.setPassword("pass123");
        req1.setEmail("p1@example.com");
        req1.setPhone("12345");
        userService.register(req1);

        UserRegistrationRequest req2 = new UserRegistrationRequest();
        req2.setUsername("userp2");
        req2.setPassword("pass456");
        req2.setEmail("p2@example.com");
        req2.setPhone("12345");

        Exception ex = assertThrows(DuplicateResourceException.class, () -> {
            userService.register(req2);
        });
        assertEquals("手机号已被使用", ex.getMessage());
    }

    /**
     * 测试 updateContact 能更新用户的邮箱和手机号并持久化。
     */
    @Test
    void testUpdateContact() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("contactUser");
        req.setPassword("pass123");
        req.setEmail("contact@example.com");
        req.setPhone("1234567");
        UserResponse created = userService.register(req);

        UserContactResponse updated = userService.updateContact(created.getId(), "changed@example.com", "7654321");

        assertEquals("changed@example.com", updated.email());
        assertEquals("7654321", updated.phone());

        User persisted = userRepository.findById(created.getId()).orElseThrow();
        assertEquals("changed@example.com", persisted.getEmail());
        assertEquals("7654321", persisted.getPhone());
    }

    /**
     * 测试 testLoginDeviceLimit 接口
     */
    @Test
    void testLoginDeviceLimit() {
        // create user
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("deviceuser");
        req.setPassword("pass123");
        req.setEmail("device@example.com");
        req.setPhone("103");
        UserResponse resp = userService.register(req);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setAccount("deviceuser");
        loginReq.setPassword("pass123");

        loginReq.setDeviceInfo("d1");
        userService.login(loginReq);
        loginReq.setDeviceInfo("d2");
        userService.login(loginReq);
        loginReq.setDeviceInfo("d3");
        userService.login(loginReq);
        loginReq.setDeviceInfo("d4");
        userService.login(loginReq);

        List<LoginDevice> devices = loginDeviceRepository.findByUserIdOrderByLoginTimeAsc(resp.getId());
        assertEquals(3, devices.size());
        assertFalse(devices.stream().anyMatch(d -> "d1".equals(d.getDeviceInfo())));
    }

    /**
     * 测试 testLoginByPhone 接口
     */
    @Test
    void testLoginByPhone() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("phoneuser");
        req.setPassword("pass123");
        req.setEmail("phone@example.com");
        req.setPhone("555");
        userService.register(req);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setAccount("555");
        loginReq.setPassword("pass123");

        assertNotNull(userService.login(loginReq).getToken());
    }

    /**
     * 测试 testLogout 接口
     */
    @Test
    void testLogout() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("logoutuser");
        req.setPassword("pass123");
        req.setEmail("logout@example.com");
        req.setPhone("888");
        UserResponse resp = userService.register(req);

        LoginRequest loginReq = new LoginRequest();
        loginReq.setAccount("logoutuser");
        loginReq.setPassword("pass123");
        String token = userService.login(loginReq).getToken();

        userService.logout(resp.getId(), token);

        User user = userRepository.findById(resp.getId()).orElseThrow();
        assertNull(user.getLoginToken());
    }

    /**
     * 测试 testUpdateAvatar 接口
     */
    @Test
    void testUpdateAvatar() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("avataruser");
        req.setPassword("pass123");
        req.setEmail("avatar@example.com");
        req.setPhone("104");
        UserResponse resp = userService.register(req);

        AvatarResponse updated = userService.updateAvatar(resp.getId(), "url");
        assertEquals("url", updated.getAvatar());

        AvatarResponse fetched = userService.getAvatar(resp.getId());
        assertEquals("url", fetched.getAvatar());
    }

    /**
     * 测试 testUploadAvatar 接口
     */
    @Test
    void testUploadAvatar() throws Exception {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("uploaduser");
        req.setPassword("pass");
        req.setEmail("up@example.com");
        req.setPhone("109");
        UserResponse resp = userService.register(req);

        MultipartFile file = mock(MultipartFile.class);
        when(avatarStorage.upload(file)).thenReturn("path/url.jpg");

        AvatarResponse result = userService.uploadAvatar(resp.getId(), file);
        assertEquals("path/url.jpg", result.getAvatar());
    }

    /**
     * 测试 testCountActiveUsers 接口
     */
    @Test
    void testCountActiveUsers() {
        User u1 = new User();
        u1.setUsername("a1");
        u1.setPassword("p");
        u1.setEmail("a1@example.com");
        u1.setPhone("201");
        userRepository.save(u1);

        User u2 = new User();
        u2.setUsername("a2");
        u2.setPassword("p");
        u2.setEmail("a2@example.com");
        u2.setPhone("202");
        u2.setDeleted(true);
        userRepository.save(u2);

        long count = userService.countActiveUsers();
        assertEquals(1, count);
    }

    /**
     * 测试 testMembershipOps 接口
     */
    @Test
    void testMembershipOps() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("member");
        req.setPassword("p");
        req.setEmail("m@example.com");
        req.setPhone("203");
        UserResponse resp = userService.register(req);

        userService.activateMembership(resp.getId());
        User user = userRepository.findById(resp.getId()).orElseThrow();
        assertTrue(user.getMember());

        userService.removeMembership(resp.getId());
        User user2 = userRepository.findById(resp.getId()).orElseThrow();
        assertFalse(user2.getMember());
    }

    /**
     * Ensure a default profile is created on registration.
     */
    @Test
    void testDefaultProfileOnRegister() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("pro1");
        req.setPassword("pass");
        req.setEmail("p1@example.com");
        req.setPhone("301");
        UserResponse resp = userService.register(req);

        assertTrue(userProfileRepository.findByUserId(resp.getId()).isPresent());
    }
}
