package com.glancy.backend.config;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.glancy.backend.service.SearchRecordService;
import com.glancy.backend.service.UserService;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(com.glancy.backend.controller.SearchRecordController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class TokenAuthenticationFilterTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SearchRecordService searchRecordService;

    @MockBean
    private UserService userService;

    /**
     * 测试 missingTokenReturnsUnauthorized 接口
     */
    @Test
    void missingTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/search-records/user")).andExpect(status().isUnauthorized());
    }

    /**
     * Token resolves to user and allows access.
     */
    @Test
    void validTokenReturnsOk() throws Exception {
        when(userService.authenticateToken("good")).thenReturn(7L);
        when(searchRecordService.getRecords(7L)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/search-records/user").header("X-USER-TOKEN", "good")).andExpect(status().isOk());
    }

    /**
     * Invalid token results in unauthorized.
     */
    @Test
    void invalidTokenReturnsUnauthorized() throws Exception {
        when(userService.authenticateToken("bad")).thenThrow(new IllegalArgumentException("invalid"));

        mockMvc
            .perform(get("/api/search-records/user").header("X-USER-TOKEN", "bad"))
            .andExpect(status().isUnauthorized());
    }

    /**
     * Test that token provided via query parameter is accepted.
     */
    @Test
    void tokenQueryParamAccepted() throws Exception {
        when(userService.authenticateToken("tkn")).thenReturn(7L);
        when(searchRecordService.getRecords(7L)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/search-records/user").param("token", "tkn")).andExpect(status().isOk());
    }
}
