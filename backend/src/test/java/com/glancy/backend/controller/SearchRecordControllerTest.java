package com.glancy.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

@WebMvcTest(SearchRecordController.class)
@Import({
    com.glancy.backend.config.security.SecurityConfig.class,
    com.glancy.backend.config.WebConfig.class,
    com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
})
class SearchRecordControllerTest {

    private static final String CREATE_PAYLOAD = "{\"term\":\"hello\",\"language\":\"ENGLISH\"}";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SearchRecordService searchRecordService;

    @MockitoBean
    private UserService userService;

    @BeforeEach
    void mockAuth() {
        when(userService.authenticateToken("tkn")).thenReturn(1L);
    }

    @Test
    void whenCreatingRecord_thenStatusCreated() throws Exception {
        performCreateRecord().andExpect(MockMvcResultMatchers.status().isCreated());
    }

    @Test
    void whenCreatingRecord_thenResponseContainsId() throws Exception {
        performCreateRecord().andExpect(MockMvcResultMatchers.jsonPath("$.id").value(1));
    }

    @Test
    void whenCreatingRecord_thenResponseContainsTerm() throws Exception {
        performCreateRecord().andExpect(MockMvcResultMatchers.jsonPath("$.term").value("hello"));
    }

    @Test
    void whenCreatingRecord_thenVersionsArrayReturned() throws Exception {
        performCreateRecord()
                .andExpect(MockMvcResultMatchers.jsonPath("$.versions").isArray());
    }

    @Test
    void whenListingRecords_thenStatusOk() throws Exception {
        performListRecords().andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void whenListingRecords_thenResponseContainsId() throws Exception {
        performListRecords().andExpect(MockMvcResultMatchers.jsonPath("$[0].id").value(1));
    }

    @Test
    void whenListingRecords_thenResponseContainsTerm() throws Exception {
        performListRecords()
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].term").value("hello"));
    }

    @Test
    void whenListingRecords_thenVersionsArrayReturned() throws Exception {
        performListRecords()
                .andExpect(MockMvcResultMatchers.jsonPath("$[0].versions").isArray());
    }

    @Test
    void whenListingRecords_thenRequestsFirstPage() throws Exception {
        performListRecords();
        verify(searchRecordService).getRecords(eq(1L), eq(SearchRecordPageRequest.firstPage()));
    }

    /** 模拟自定义分页参数请求，断言服务层收到归一化后的 page 与 size。 */
    @Test
    void whenListingWithPagination_thenStatusOk() throws Exception {
        performListRecordsWithPagination(2, 50)
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void whenListingWithPagination_thenRequestsProvidedPage() throws Exception {
        performListRecordsWithPagination(2, 50);
        verify(searchRecordService).getRecords(eq(1L), eq(new SearchRecordPageRequest(2, 50)));
    }

    private ResultActions performCreateRecord() throws Exception {
        LocalDateTime createdAt = LocalDateTime.now();
        SearchRecordVersionSummary version = version(2L, 1, createdAt, "gpt-4", "preview");
        when(searchRecordService.saveRecord(any(Long.class), any(SearchRecordRequest.class)))
                .thenReturn(response(createdAt, false, version, List.of(version)));

        return mockMvc.perform(postRecordRequest().withBody(CREATE_PAYLOAD).build());
    }

    private ResultActions performListRecords() throws Exception {
        LocalDateTime createdAt = LocalDateTime.now();
        SearchRecordVersionSummary latestVersion = version(3L, 2, createdAt, "gpt-4", "preview");
        SearchRecordVersionSummary previousVersion = version(4L, 1, createdAt.minusMinutes(1), "gpt-3.5", "older");
        when(searchRecordService.getRecords(eq(1L), any(SearchRecordPageRequest.class)))
                .thenReturn(List.of(response(createdAt, true, latestVersion, List.of(previousVersion, latestVersion))));
        return mockMvc.perform(listRecordRequest().build());
    }

    private ResultActions performListRecordsWithPagination(int page, int size) throws Exception {
        when(searchRecordService.getRecords(eq(1L), any(SearchRecordPageRequest.class)))
                .thenReturn(List.of());
        return mockMvc.perform(listRecordRequest().withPage(page).withSize(size).build());
    }

    private SearchRecordRequestBuilder postRecordRequest() {
        return SearchRecordRequestBuilder.postUserRecord();
    }

    private SearchRecordRequestBuilder listRecordRequest() {
        return SearchRecordRequestBuilder.getUserRecords();
    }

    private SearchRecordVersionSummary version(
            long id, int versionNumber, LocalDateTime createdAt, String model, String preview) {
        return new SearchRecordVersionSummary(id, versionNumber, createdAt, model, preview, DictionaryFlavor.BILINGUAL);
    }

    private SearchRecordResponse response(
            LocalDateTime createdAt,
            boolean pinned,
            SearchRecordVersionSummary latest,
            List<SearchRecordVersionSummary> versions) {
        return new SearchRecordResponse(
                1L, 1L, "hello", Language.ENGLISH, DictionaryFlavor.BILINGUAL, createdAt, pinned, latest, versions);
    }

    private static final class SearchRecordRequestBuilder {
        private final MockHttpServletRequestBuilder delegate;

        private SearchRecordRequestBuilder(MockHttpServletRequestBuilder delegate) {
            this.delegate = delegate.header("X-USER-TOKEN", "tkn");
        }

        static SearchRecordRequestBuilder postUserRecord() {
            return new SearchRecordRequestBuilder(
                    MockMvcRequestBuilders.post("/api/search-records/user").contentType(MediaType.APPLICATION_JSON));
        }

        static SearchRecordRequestBuilder getUserRecords() {
            return new SearchRecordRequestBuilder(MockMvcRequestBuilders.get("/api/search-records/user"));
        }

        SearchRecordRequestBuilder withBody(String body) {
            delegate.content(body);
            return this;
        }

        SearchRecordRequestBuilder withPage(int page) {
            delegate.param("page", Integer.toString(page));
            return this;
        }

        SearchRecordRequestBuilder withSize(int size) {
            delegate.param("size", Integer.toString(size));
            return this;
        }

        MockHttpServletRequestBuilder build() {
            return delegate;
        }
    }
}
