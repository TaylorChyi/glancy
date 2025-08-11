package com.glancy.backend.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(LocaleController.class)
@Import(com.glancy.backend.config.SecurityConfig.class)
class LocaleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private com.glancy.backend.service.UserService userService;

    /**
     * 测试带有 Accept-Language 头部时返回的语言信息
     */
    /**
     * 测试 getLocaleFromHeader 接口
     */
    @Test
    void getLocaleFromHeader() throws Exception {
        mockMvc
            .perform(get("/api/locale").header("Accept-Language", "zh-CN,zh;q=0.9"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.country").value("CN"))
            .andExpect(jsonPath("$.language").value("zh"));
    }

    /**
     * 测试当没有头部时根据请求 Locale 推断语言
     */
    /**
     * 测试 getLocaleFromRequestLocale 接口
     */
    @Test
    void getLocaleFromRequestLocale() throws Exception {
        mockMvc
            .perform(get("/api/locale").locale(Locale.CHINA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.country").value("CN"))
            .andExpect(jsonPath("$.language").value("zh"));
    }

    /**
     * 测试国家映射到预设语言的情况
     */
    /**
     * 测试 getLocaleMapping 接口
     */
    @Test
    void getLocaleMapping() throws Exception {
        mockMvc
            .perform(get("/api/locale").header("Accept-Language", "US"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.country").value("US"))
            .andExpect(jsonPath("$.language").value("en"));
    }
}
