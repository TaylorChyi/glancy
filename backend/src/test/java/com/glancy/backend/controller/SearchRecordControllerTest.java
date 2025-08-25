package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.SearchRecordService;
import com.glancy.backend.service.UserService;
import java.time.LocalDateTime;
import java.util.Collections;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SearchRecordController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class SearchRecordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SearchRecordService searchRecordService;

    @MockitoBean
    private UserService userService;

    /**
     * 测试 testCreate 接口
     */
    @Test
    void testCreate() throws Exception {
        SearchRecordResponse resp = new SearchRecordResponse(
            1L,
            1L,
            "hello",
            Language.ENGLISH,
            LocalDateTime.now(),
            false
        );
        when(searchRecordService.saveRecord(any(Long.class), any(SearchRecordRequest.class))).thenReturn(resp);

        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                post("/api/search-records/user")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"term\":\"hello\",\"language\":\"ENGLISH\"}")
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.term").value("hello"));
    }

    /**
     * 测试 testList 接口
     */
    @Test
    void testList() throws Exception {
        SearchRecordResponse resp = new SearchRecordResponse(
            1L,
            1L,
            "hello",
            Language.ENGLISH,
            LocalDateTime.now(),
            true
        );
        when(searchRecordService.getRecords(1L)).thenReturn(Collections.singletonList(resp));

        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(get("/api/search-records/user").header("X-USER-TOKEN", "tkn"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].term").value("hello"));
    }
}
