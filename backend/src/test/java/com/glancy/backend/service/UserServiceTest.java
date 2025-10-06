package com.glancy.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.glancy.backend.dto.AvatarResponse;
import com.glancy.backend.dto.LoginRequest;
import com.glancy.backend.dto.UserContactResponse;
import com.glancy.backend.dto.UserEmailResponse;
import com.glancy.backend.dto.UserRegistrationRequest;
import com.glancy.backend.dto.UserResponse;
import com.glancy.backend.entity.EmailVerificationPurpose;
import com.glancy.backend.entity.LoginDevice;
import com.glancy.backend.entity.MembershipType;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.DuplicateResourceException;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.LoginDeviceRepository;
import com.glancy.backend.repository.UserProfileRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@SpringBootTest
@Transactional
@TestPropertySource(
    properties = {
        "oss.endpoint=http://localhost",
        "oss.bucket=test-bucket",
        "oss.access-key-id=test-access",
        "oss.access-key-secret=test-secret",
        "oss.verify-location=false",
    }
)
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

    @MockitoBean
    private EmailVerificationService emailVerificationService;

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
        when(avatarStorage.resolveUrl(anyString())).thenAnswer(invocation -> invocation.getArgument(0));
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
        assertFalse(resp.getMember());
        assertEquals(MembershipType.NONE, resp.getMembershipType());
        assertNull(resp.getMembershipExpiresAt());

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
     * 测试目标：验证 updateContact 支持更新手机号但拒绝直接修改邮箱。
     */
    @Test
    void testUpdateContact() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("contactUser");
        req.setPassword("pass123");
        req.setEmail("contact@example.com");
        req.setPhone("1234567");
        UserResponse created = userService.register(req);

        UserContactResponse updated = userService.updateContact(created.getId(), "contact@example.com", "7654321");

        assertEquals("contact@example.com", updated.email());
        assertEquals("7654321", updated.phone());

        User persisted = userRepository.findById(created.getId()).orElseThrow();
        assertEquals("contact@example.com", persisted.getEmail());
        assertEquals("7654321", persisted.getPhone());

        InvalidRequestException exception = assertThrows(InvalidRequestException.class, () ->
            userService.updateContact(created.getId(), "changed@example.com", "7654321")
        );
        assertEquals("请通过邮箱换绑流程完成更新", exception.getMessage());
    }

    /**
     * 验证 requestEmailChangeCode 会调用验证码发送服务。
     */
    @Test
    void testRequestEmailChangeCode() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("emailchange");
        req.setPassword("pass123");
        req.setEmail("change@example.com");
        req.setPhone("4567");
        UserResponse created = userService.register(req);

        doNothing().when(emailVerificationService).issueCode("next@example.com", EmailVerificationPurpose.CHANGE_EMAIL);

        userService.requestEmailChangeCode(created.getId(), "next@example.com");

        verify(emailVerificationService).issueCode("next@example.com", EmailVerificationPurpose.CHANGE_EMAIL);
    }

    /**
     * 验证 changeEmail 会消费验证码并更新数据库中的邮箱。
     */
    @Test
    void testChangeEmail() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("emailchange2");
        req.setPassword("pass123");
        req.setEmail("before@example.com");
        req.setPhone("6543");
        UserResponse created = userService.register(req);

        doNothing()
            .when(emailVerificationService)
            .consumeCode("after@example.com", "123456", EmailVerificationPurpose.CHANGE_EMAIL);

        UserEmailResponse response = userService.changeEmail(created.getId(), "after@example.com", "123456");

        assertEquals("after@example.com", response.email());
        User persisted = userRepository.findById(created.getId()).orElseThrow();
        assertEquals("after@example.com", persisted.getEmail());
    }

    /**
     * 测试目标：验证 unbindEmail 在首次解绑后清空邮箱并在重复调用时保持幂等。
     * 前置条件：已注册且绑定邮箱的用户；邮箱验证码服务未产生交互。
     * 步骤：
     *  1) 注册用户并确认邮箱已设置；
     *  2) 调用 unbindEmail 完成解绑；
     *  3) 再次调用 unbindEmail 验证幂等性；
     * 断言：
     *  - 第一次返回值中的邮箱为 null；
     *  - 第二次调用仍返回 null 且数据库中邮箱字段保持为空；
     * 边界/异常：已解绑的账号再次解绑不会抛出异常。
     */
    @Test
    void testUnbindEmail() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("emailunbind");
        req.setPassword("pass123");
        req.setEmail("unbind@example.com");
        req.setPhone("9876");
        UserResponse created = userService.register(req);

        UserEmailResponse response = userService.unbindEmail(created.getId());

        assertNull(response.email());
        verify(emailVerificationService).invalidateCodes("unbind@example.com", EmailVerificationPurpose.CHANGE_EMAIL);
        UserEmailResponse second = userService.unbindEmail(created.getId());
        assertNull(second.email());
        verifyNoMoreInteractions(emailVerificationService);
        User persisted = userRepository.findById(created.getId()).orElseThrow();
        assertNull(persisted.getEmail());
    }

    /**
     * 测试目标：验证 requestEmailChangeCode 拒绝与当前邮箱相同的目标地址。
     * 前置条件：数据库中存在已绑定邮箱的用户。
     * 步骤：
     *  1) 注册用户并记录初始邮箱；
     *  2) 使用大小写不同但语义一致的邮箱调用 requestEmailChangeCode；
     * 断言：
     *  - 抛出 InvalidRequestException；
     *  - 邮箱验证码服务无交互产生；
     * 边界/异常：邮箱大小写差异也视为相同地址。
     */
    @Test
    void Given_SameEmail_When_RequestEmailChangeCode_Then_Reject() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("sameEmailUser");
        req.setPassword("pass123");
        req.setEmail("primary@example.com");
        req.setPhone("7777");
        UserResponse created = userService.register(req);

        clearInvocations(emailVerificationService);

        InvalidRequestException exception = assertThrows(InvalidRequestException.class, () ->
            userService.requestEmailChangeCode(created.getId(), "Primary@Example.com")
        );

        assertEquals("新邮箱不能与当前邮箱相同", exception.getMessage());
        verifyNoInteractions(emailVerificationService);
    }

    /**
     * 测试目标：验证 requestEmailChangeCode 遇到其他账号已占用的邮箱时抛出重复资源异常。
     * 前置条件：系统中存在另一位使用目标邮箱的用户。
     * 步骤：
     *  1) 注册用户 A；
     *  2) 注册用户 B 并绑定目标邮箱；
     *  3) 为用户 A 请求换绑到该邮箱；
     * 断言：
     *  - 抛出 DuplicateResourceException；
     *  - 邮箱验证码服务未被调用；
     * 边界/异常：邮箱大小写差异同样视为重复。
     */
    @Test
    void Given_EmailOccupiedByOtherUser_When_RequestEmailChangeCode_Then_ThrowDuplicate() {
        UserRegistrationRequest first = new UserRegistrationRequest();
        first.setUsername("firstUser");
        first.setPassword("pass123");
        first.setEmail("first@example.com");
        first.setPhone("8888");
        UserResponse firstUser = userService.register(first);

        UserRegistrationRequest second = new UserRegistrationRequest();
        second.setUsername("secondUser");
        second.setPassword("pass456");
        second.setEmail("target@example.com");
        second.setPhone("9999");
        userService.register(second);

        clearInvocations(emailVerificationService);

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class, () ->
            userService.requestEmailChangeCode(firstUser.getId(), "TARGET@example.com")
        );

        assertEquals("邮箱已被使用", exception.getMessage());
        verifyNoInteractions(emailVerificationService);
    }

    /**
     * 测试目标：验证 changeEmail 拒绝空验证码输入。
     * 前置条件：数据库中存在待换绑邮箱的合法用户。
     * 步骤：
     *  1) 注册用户；
     *  2) 使用全空格验证码调用 changeEmail；
     * 断言：
     *  - 抛出 InvalidRequestException 并提示验证码不能为空；
     *  - 邮箱验证码服务未被调用；
     * 边界/异常：null 与纯空格均视为非法输入。
     */
    @Test
    void Given_BlankCode_When_ChangeEmail_Then_ThrowInvalidRequest() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("blankCodeUser");
        req.setPassword("pass123");
        req.setEmail("before-change@example.com");
        req.setPhone("5555");
        UserResponse created = userService.register(req);

        clearInvocations(emailVerificationService);

        InvalidRequestException exception = assertThrows(InvalidRequestException.class, () ->
            userService.changeEmail(created.getId(), "after-change@example.com", "   ")
        );

        assertEquals("验证码不能为空", exception.getMessage());
        verifyNoInteractions(emailVerificationService);
    }

    /**
     * 测试目标：确保 requestEmailChangeCode 拒绝空邮箱输入。
     * 前置条件：数据库中存在合法用户。
     * 步骤：
     *  1) 注册用户；
     *  2) 清理邮箱验证码服务的交互记录；
     *  3) 传入空格字符串调用 requestEmailChangeCode；
     * 断言：
     *  - 抛出 InvalidRequestException 且提示邮箱不能为空；
     *  - 邮箱验证码服务无交互产生；
     * 边界/异常：输入为空或全空格均触发同一异常。
     */
    @Test
    void Given_BlankEmail_When_RequestEmailChangeCode_Then_ThrowInvalidRequest() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("blankemail");
        req.setPassword("pass123");
        req.setEmail("blank@example.com");
        req.setPhone("0000");
        UserResponse created = userService.register(req);

        clearInvocations(emailVerificationService);

        InvalidRequestException exception = assertThrows(InvalidRequestException.class, () ->
            userService.requestEmailChangeCode(created.getId(), "   ")
        );

        assertEquals("邮箱不能为空", exception.getMessage());
        verifyNoInteractions(emailVerificationService);
    }

    /**
     * 测试目标：验证 changeEmail 会裁剪验证码中的空白并调用校验服务。
     * 前置条件：数据库已有绑定邮箱的用户，验证码服务被 Stub 为通过。
     * 步骤：
     *  1) 注册用户；
     *  2) 配置验证码服务在接收到去空白后的验证码时返回成功；
     *  3) 携带前后空格的验证码调用 changeEmail；
     * 断言：
     *  - 返回结果中的邮箱更新为新邮箱；
     *  - 验证码服务收到去空白后的验证码；
     * 边界/异常：验证码全空格时将由 sanitizeVerificationCode 抛出异常（另测覆盖）。
     */
    @Test
    void Given_CodeWithWhitespace_When_ChangeEmail_Then_TrimBeforeConsume() {
        UserRegistrationRequest req = new UserRegistrationRequest();
        req.setUsername("trimcode");
        req.setPassword("pass123");
        req.setEmail("trim-before@example.com");
        req.setPhone("1111");
        UserResponse created = userService.register(req);

        doNothing()
            .when(emailVerificationService)
            .consumeCode("after@example.com", "654321", EmailVerificationPurpose.CHANGE_EMAIL);

        UserEmailResponse response = userService.changeEmail(created.getId(), "after@example.com", " 654321 ");

        assertEquals("after@example.com", response.email());
        verify(emailVerificationService).consumeCode(
            "after@example.com",
            "654321",
            EmailVerificationPurpose.CHANGE_EMAIL
        );
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

        LocalDateTime expiresAt = LocalDateTime.now().plusDays(7);
        userService.activateMembership(resp.getId(), MembershipType.PRO, expiresAt);
        User user = userRepository.findById(resp.getId()).orElseThrow();
        assertEquals(MembershipType.PRO, user.getMembershipType());
        assertEquals(expiresAt, user.getMembershipExpiresAt());
        assertTrue(user.hasActiveMembershipAt(LocalDateTime.now()));

        userService.removeMembership(resp.getId());
        User user2 = userRepository.findById(resp.getId()).orElseThrow();
        assertEquals(MembershipType.NONE, user2.getMembershipType());
        assertNull(user2.getMembershipExpiresAt());
        assertFalse(user2.hasActiveMembershipAt(LocalDateTime.now()));
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
