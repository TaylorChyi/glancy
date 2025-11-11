package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import com.glancy.backend.dto.SearchRecordRequest;
import com.glancy.backend.dto.SearchRecordResponse;
import com.glancy.backend.dto.SearchRecordVersionSummary;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.SearchRecordService;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.support.SearchRecordPageRequest;
import java.time.LocalDateTime;
import java.util.List;
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
     * 模拟认证成功后创建搜索记录的请求，断言响应体包含基础字段以及最新版本信息结构。
     */
    @Test
    void testCreate() throws Exception {
        LocalDateTime createdAt = LocalDateTime.now();
        SearchRecordVersionSummary version = new SearchRecordVersionSummary(
            2L,
            1,
            createdAt,
            "gpt-4",
            "preview",
            DictionaryFlavor.BILINGUAL
        );
        SearchRecordResponse resp = new SearchRecordResponse(
            1L,
            1L,
            "hello",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            createdAt,
            false,
            version,
            List.of(version)
        );
        when(searchRecordService.saveRecord(any(Long.class), any(SearchRecordRequest.class))).thenReturn(resp);

        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                MockMvcRequestBuilders.post("/api/search-records/user")
                    .header("X-USER-TOKEN", "tkn")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"term\":\"hello\",\"language\":\"ENGLISH\"}")
            )
            .andExpect(MockMvcResultMatchers.status().isCreated())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1))
            .andExpect(MockMvcResultMatchers.jsonPath("$.term").value("hello"))
            .andExpect(MockMvcResultMatchers.jsonPath("$.versions").isArray());
    }

    /**
     * 模拟认证成功后获取历史列表，断言列表项携带最新版本与完整版本数组并保持成功状态。
     */
    @Test
    void testList() throws Exception {
        LocalDateTime createdAt = LocalDateTime.now();
        SearchRecordVersionSummary latestVersion = new SearchRecordVersionSummary(
            3L,
            2,
            createdAt,
            "gpt-4",
            "preview",
            DictionaryFlavor.BILINGUAL
        );
        SearchRecordVersionSummary previousVersion = new SearchRecordVersionSummary(
            4L,
            1,
            createdAt.minusMinutes(1),
            "gpt-3.5",
            "older",
            DictionaryFlavor.BILINGUAL
        );
        SearchRecordResponse resp = new SearchRecordResponse(
            1L,
            1L,
            "hello",
            Language.ENGLISH,
            DictionaryFlavor.BILINGUAL,
            createdAt,
            true,
            latestVersion,
            List.of(previousVersion, latestVersion)
        );
        when(searchRecordService.getRecords(eq(1L), any(SearchRecordPageRequest.class))).thenReturn(List.of(resp));

        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(MockMvcRequestBuilders.get("/api/search-records/user").header("X-USER-TOKEN", "tkn"))
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$[0].id").value(1))
            .andExpect(MockMvcResultMatchers.jsonPath("$[0].term").value("hello"))
            .andExpect(MockMvcResultMatchers.jsonPath("$[0].versions").isArray());

        verify(searchRecordService).getRecords(eq(1L), eq(SearchRecordPageRequest.firstPage()));
    }

    /**
     * 模拟自定义分页参数请求，断言服务层收到归一化后的 page 与 size。
     */
    @Test
    void testListWithPagination() throws Exception {
        when(searchRecordService.getRecords(eq(1L), any(SearchRecordPageRequest.class))).thenReturn(List.of());
        when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(MockMvcRequestBuilders.get("/api/search-records/user?page=2&size=50").header("X-USER-TOKEN", "tkn"))
            .andExpect(MockMvcResultMatchers.status().isOk());

        verify(searchRecordService).getRecords(eq(1L), eq(new SearchRecordPageRequest(2, 50)));
    }
}
