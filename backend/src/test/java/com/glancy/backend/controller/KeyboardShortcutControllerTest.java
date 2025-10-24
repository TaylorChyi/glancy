package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.glancy.backend.dto.keyboard.KeyboardShortcutResponse;
import com.glancy.backend.dto.keyboard.KeyboardShortcutUpdateRequest;
import com.glancy.backend.dto.keyboard.KeyboardShortcutView;
import com.glancy.backend.entity.ShortcutAction;
import com.glancy.backend.service.shortcut.KeyboardShortcutService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(KeyboardShortcutController.class)
class KeyboardShortcutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private KeyboardShortcutService keyboardShortcutService;

    /**
     * 测试目标：GET /api/preferences/shortcuts/user 应返回服务层提供的快捷键列表。
     * 前置条件：服务层返回包含一个快捷键的响应。
     * 步骤：
     *  1) 模拟服务层响应；
     *  2) 发送 GET 请求；
     * 断言：
     *  - HTTP 状态 200；
     *  - 响应体包含约定的字段和值。
     * 边界/异常：
     *  - 若服务抛出异常应交由全局异常处理（此处不覆盖）。
     */
    @Test
    void Given_getRequest_When_fetchShortcuts_Then_returnPayload() throws Exception {
        KeyboardShortcutView view = new KeyboardShortcutView(
            ShortcutAction.FOCUS_SEARCH.name(),
            List.of("MOD", "SHIFT", "F"),
            List.of("MOD", "SHIFT", "F")
        );
        given(keyboardShortcutService.getShortcuts(1L)).willReturn(new KeyboardShortcutResponse(List.of(view)));

        mockMvc
            .perform(get("/api/preferences/shortcuts/user").requestAttr("userId", 1L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.shortcuts[0].action").value("FOCUS_SEARCH"))
            .andExpect(jsonPath("$.shortcuts[0].keys[1]").value("SHIFT"));
    }

    /**
     * 测试目标：PUT /api/preferences/shortcuts/user/{action} 应调用服务更新快捷键。
     * 前置条件：服务层返回更新后的列表。
     * 步骤：
     *  1) 模拟服务层响应；
     *  2) 发送 PUT 请求并携带 JSON；
     * 断言：
     *  - HTTP 状态 200；
     *  - 服务层收到正确的参数。
     * 边界/异常：
     *  - 无。
     */
    @Test
    void Given_putRequest_When_updateShortcut_Then_delegateToService() throws Exception {
        KeyboardShortcutView view = new KeyboardShortcutView(
            ShortcutAction.FOCUS_SEARCH.name(),
            List.of("CONTROL", "SHIFT", "P"),
            List.of("MOD", "SHIFT", "F")
        );
        given(
            keyboardShortcutService.updateShortcut(
                eq(2L),
                eq(ShortcutAction.FOCUS_SEARCH),
                any(KeyboardShortcutUpdateRequest.class)
            )
        ).willReturn(new KeyboardShortcutResponse(List.of(view)));

        mockMvc
            .perform(
                put("/api/preferences/shortcuts/user/FOCUS_SEARCH")
                    .requestAttr("userId", 2L)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"keys\":[\"control\",\"shift\",\"p\"]}")
            )
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.shortcuts[0].keys[0]").value("CONTROL"));

        verify(keyboardShortcutService).updateShortcut(
            eq(2L),
            eq(ShortcutAction.FOCUS_SEARCH),
            any(KeyboardShortcutUpdateRequest.class)
        );
    }

    /**
     * 测试目标：DELETE /api/preferences/shortcuts/user 应触发服务层重置逻辑。
     * 前置条件：服务层返回默认列表。
     * 步骤：
     *  1) 模拟服务层响应；
     *  2) 发送 DELETE 请求；
     * 断言：
     *  - HTTP 状态 200；
     *  - 服务层方法被调用。
     * 边界/异常：
     *  - 无。
     */
    @Test
    void Given_deleteRequest_When_resetShortcuts_Then_delegateToService() throws Exception {
        KeyboardShortcutView view = new KeyboardShortcutView(
            ShortcutAction.FOCUS_SEARCH.name(),
            List.of("MOD", "SHIFT", "F"),
            List.of("MOD", "SHIFT", "F")
        );
        given(keyboardShortcutService.resetShortcuts(3L)).willReturn(new KeyboardShortcutResponse(List.of(view)));

        mockMvc
            .perform(delete("/api/preferences/shortcuts/user").requestAttr("userId", 3L))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.shortcuts[0].defaultKeys[2]").value("F"));

        verify(keyboardShortcutService).resetShortcuts(3L);
    }
}
