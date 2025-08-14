package com.glancy.backend.config;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.glancy.backend.service.SearchRecordService;
import com.glancy.backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
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

    @MockitoBean
    private SearchRecordService searchRecordService;

    @MockitoBean
    private UserService userService;

    /**
     * 测试 missingTokenReturnsUnauthorized 接口
     */
    @Test
    void missingTokenReturnsUnauthorized() throws Exception {
        mockMvc
            .perform(
                post("/api/search-records/user")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"term\":\"hello\",\"language\":\"ENGLISH\"}")
            )
            .andExpect(status().isUnauthorized());
    }

    /**
     * 测试 invalidTokenReturnsUnauthorized 接口
     */
    @Test
    void invalidTokenReturnsUnauthorized() throws Exception {
        doThrow(new IllegalArgumentException("invalid")).when(userService).validateToken("bad");

        mockMvc
            .perform(
                post("/api/search-records/user")
                    .header("X-USER-TOKEN", "bad")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"term\":\"hello\",\"language\":\"ENGLISH\"}")
            )
            .andExpect(status().isUnauthorized());
    }

    /**
     * Test that token provided via query parameter is accepted.
     */
    @Test
    void tokenQueryParamAccepted() throws Exception {
        when(userService.validateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                post("/api/search-records/user")
                    .param("token", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"term\":\"hello\",\"language\":\"ENGLISH\"}")
            )
            .andExpect(status().isCreated());
    }
}
