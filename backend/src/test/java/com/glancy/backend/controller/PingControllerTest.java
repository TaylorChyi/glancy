package com.glancy.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PingController.class)
@Import(com.glancy.backend.config.SecurityConfig.class)
class PingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private com.glancy.backend.service.UserService userService;

    /**
     * 测试 ping 接口
     */
    @Test
    void ping() throws Exception {
        mockMvc.perform(get("/api/ping")).andExpect(status().isOk()).andExpect(content().string("pong"));
    }
}
