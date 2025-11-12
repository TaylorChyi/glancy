package com.glancy.backend.service.shortcut;

import com.glancy.backend.dto.KeyboardShortcutResponse;
import com.glancy.backend.dto.KeyboardShortcutUpdateRequest;
import com.glancy.backend.entity.ShortcutAction;
import com.glancy.backend.entity.User;
import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.repository.UserKeyboardShortcutRepository;
import com.glancy.backend.repository.UserRepository;
import io.github.cdimascio.dotenv.Dotenv;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(
    properties = {
        "oss.endpoint=https://oss-cn-hangzhou.aliyuncs.com",
        "oss.bucket=test-bucket",
        "oss.access-key-id=dummy",
        "oss.access-key-secret=dummy",
        "oss.verify-location=false",
    }
)
@Transactional
class KeyboardShortcutServiceTest {

    @Autowired
    private KeyboardShortcutService keyboardShortcutService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserKeyboardShortcutRepository shortcutRepository;

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
        shortcutRepository.deleteAll();
        userRepository.deleteAll();
    }

    private User createUser() {
        User user = new User();
        user.setUsername("shortcut-user");
        user.setPassword("pass");
        user.setEmail("shortcut@example.com");
        user.setPhone("10086");
        return userRepository.save(user);
    }

    /**
     * 测试目标：首次读取快捷键时应返回所有默认配置。
     * 前置条件：数据库中不存在用户快捷键覆盖记录。
     * 步骤：
     *  1) 创建用户；
     *  2) 调用 getShortcuts。
     * 断言：
     *  - 返回列表长度与枚举数量一致；
     *  - 每项 keys 与 defaultKeys 相同；
     *  - 默认组合包含主按键。
     * 边界/异常：
     *  - 若用户不存在应抛出 ResourceNotFoundException（由控制层覆盖）。
     */
    @Test
    void Given_noOverrides_When_getShortcuts_Then_returnDefaults() {
        User user = createUser();

        KeyboardShortcutResponse response = keyboardShortcutService.getShortcuts(user.getId());

        Assertions.assertEquals(ShortcutAction.values().length, response.shortcuts().size(), "shortcut size");
        Assertions.assertTrue(
            response
                .shortcuts()
                .stream()
                .allMatch(view -> view.keys().equals(view.defaultKeys()) && view.keys().size() >= 2),
            "each shortcut should use default keys"
        );
    }

    /**
     * 测试目标：更新快捷键后应持久化并在再次查询时返回新绑定。
     * 前置条件：用户存在且使用默认快捷键。
     * 步骤：
     *  1) 创建用户并调用 updateShortcut 绑定新组合；
     *  2) 再次调用 getShortcuts；
     *  3) 查找对应动作的 keys。
     * 断言：
     *  - 更新后的 keys 与提交的组合一致；
     *  - 其他动作仍保持默认值。
     * 边界/异常：
     *  - 如提交重复主键应触发 InvalidRequestException（由下一用例覆盖）。
     */
    @Test
    void Given_validUpdate_When_updateShortcut_Then_overridePersisted() {
        User user = createUser();

        KeyboardShortcutUpdateRequest request = new KeyboardShortcutUpdateRequest(List.of("CONTROL", "SHIFT", "P"));
        keyboardShortcutService.updateShortcut(user.getId(), ShortcutAction.FOCUS_SEARCH, request);

        KeyboardShortcutResponse response = keyboardShortcutService.getShortcuts(user.getId());
        Assertions.assertTrue(
            response
                .shortcuts()
                .stream()
                .anyMatch(
                    view ->
                        view.action().equals(ShortcutAction.FOCUS_SEARCH.name()) &&
                        view.keys().equals(List.of("CONTROL", "SHIFT", "P"))
                ),
            "focus search should use updated binding"
        );
        Assertions.assertTrue(
            response
                .shortcuts()
                .stream()
                .filter(view -> !view.action().equals(ShortcutAction.FOCUS_SEARCH.name()))
                .allMatch(view -> view.keys().equals(view.defaultKeys())),
            "other shortcuts keep defaults"
        );
    }

    /**
     * 测试目标：当新组合与其它动作重复时应拒绝更新。
     * 前置条件：用户已存在，且某动作使用默认组合。
     * 步骤：
     *  1) 创建用户并将 SWITCH_LANGUAGE 绑定为自定义组合；
     *  2) 再次尝试将 FOCUS_SEARCH 更新为相同组合；
     * 断言：
     *  - updateShortcut 抛出 InvalidRequestException；
     *  - 数据库中原绑定不受影响。
     * 边界/异常：
     *  - 若换成不同组合则应通过（由上一用例验证）。
     */
    @Test
    void Given_conflictingBinding_When_updateShortcut_Then_throwInvalidRequest() {
        User user = createUser();

        keyboardShortcutService.updateShortcut(
            user.getId(),
            ShortcutAction.SWITCH_LANGUAGE,
            new KeyboardShortcutUpdateRequest(List.of("CONTROL", "SHIFT", "Q"))
        );

        InvalidRequestException exception = Assertions.assertThrows(InvalidRequestException.class, () ->
            keyboardShortcutService.updateShortcut(
                user.getId(),
                ShortcutAction.FOCUS_SEARCH,
                new KeyboardShortcutUpdateRequest(List.of("CONTROL", "SHIFT", "Q"))
            )
        );
        Assertions.assertEquals("快捷键已被其他功能占用", exception.getMessage());

        KeyboardShortcutResponse response = keyboardShortcutService.getShortcuts(user.getId());
        Assertions.assertTrue(
            response
                .shortcuts()
                .stream()
                .anyMatch(
                    view ->
                        view.action().equals(ShortcutAction.SWITCH_LANGUAGE.name()) &&
                        view.keys().equals(List.of("CONTROL", "SHIFT", "Q"))
                )
        );
    }

    /**
     * 测试目标：当客户端尝试使用与 MOD 默认键等价的组合时应识别冲突。
     * 前置条件：用户存在且尚未自定义 OPEN_SHORTCUTS，默认键位为 MOD+SHIFT+K。
     * 步骤：
     *  1) 以 CONTROL+SHIFT+F 更新 OPEN_SHORTCUTS；
     * 断言：
     *  - 服务抛出 InvalidRequestException；
     *  - OPEN_SHORTCUTS 仍维持默认绑定。
     * 边界/异常：
     *  - 若先修改冲突方（FOCUS_SEARCH）应允许后续操作，此处不覆盖。
     */
    @Test
    void Given_modAliasConflict_When_updateShortcut_Then_throwInvalidRequest() {
        User user = createUser();

        InvalidRequestException exception = Assertions.assertThrows(InvalidRequestException.class, () ->
            keyboardShortcutService.updateShortcut(
                user.getId(),
                ShortcutAction.OPEN_SHORTCUTS,
                new KeyboardShortcutUpdateRequest(List.of("CONTROL", "SHIFT", "F"))
            )
        );
        Assertions.assertEquals("快捷键已被其他功能占用", exception.getMessage());

        KeyboardShortcutResponse response = keyboardShortcutService.getShortcuts(user.getId());
        Assertions.assertTrue(
            response
                .shortcuts()
                .stream()
                .anyMatch(
                    view ->
                        view.action().equals(ShortcutAction.OPEN_SHORTCUTS.name()) &&
                        view.keys().equals(view.defaultKeys())
                ),
            "open shortcuts should remain default after conflict"
        );
    }
}
