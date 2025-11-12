package com.glancy.backend.service;

import com.glancy.backend.repository.LoginDeviceRepository;
import com.glancy.backend.repository.UserProfileRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

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
abstract class AbstractUserServiceTest {

    @Autowired
    protected UserService userService;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected LoginDeviceRepository loginDeviceRepository;

    @Autowired
    protected UserProfileRepository userProfileRepository;

    @MockitoBean
    protected AvatarStorage avatarStorage;

    @MockitoBean
    protected EmailVerificationService emailVerificationService;

    protected static final String CLIENT_IP = "127.0.0.1";

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
        loginDeviceRepository.deleteAll();
        userRepository.deleteAll();
        userProfileRepository.deleteAll();
        Mockito.when(avatarStorage.resolveUrl(Mockito.anyString())).thenAnswer(invocation -> invocation.getArgument(0));
    }
}
