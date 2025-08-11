package com.glancy.backend.config;

import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.glancy.backend.service.SearchRecordService;
import com.glancy.backend.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(com.glancy.backend.controller.SearchRecordController.class)
@Import({SecurityConfig.class, WebConfig.class, com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class})
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
        mockMvc
            .perform(
                post("/api/search-records/user/1")
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
        doThrow(new IllegalArgumentException("invalid")).when(userService).validateToken(1L, "bad");

        mockMvc
            .perform(
                post("/api/search-records/user/1")
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
        mockMvc
            .perform(
                post("/api/search-records/user/1")
                    .param("token", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"term\":\"hello\",\"language\":\"ENGLISH\"}")
            )
            .andExpect(status().isCreated());
    }
}
