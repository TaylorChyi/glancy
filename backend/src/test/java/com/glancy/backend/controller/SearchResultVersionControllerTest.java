package com.glancy.backend.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.glancy.backend.dto.SearchRecordVersionSummary;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.entity.SearchRecord;
import com.glancy.backend.entity.SearchResultVersion;
import com.glancy.backend.entity.User;
import com.glancy.backend.service.SearchResultService;
import com.glancy.backend.service.UserService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

/** SearchResultVersionController 接口行为测试。 */
@WebMvcTest(controllers = SearchResultVersionController.class)
@Import({
  com.glancy.backend.config.security.SecurityConfig.class,
  com.glancy.backend.config.WebConfig.class,
  com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
})
class SearchResultVersionControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private SearchResultService searchResultService;

  @MockitoBean private UserService userService;

  /** 验证版本列表接口返回基础摘要。 */
  @Test
  void listVersionsReturnsSummaries() throws Exception {
    when(userService.authenticateToken("tkn")).thenReturn(1L);
    SearchRecordVersionSummary summary =
        new SearchRecordVersionSummary(
            5L, 2, LocalDateTime.now(), "model-x", "sample", DictionaryFlavor.BILINGUAL);
    when(searchResultService.listVersionSummaries(eq(1L), eq(10L))).thenReturn(List.of(summary));

    mockMvc
        .perform(get("/api/words/10/versions").header("X-USER-TOKEN", "tkn"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("model-x")))
        .andExpect(content().string(containsString("sample")));
  }

  /** 验证版本详情接口返回完整信息。 */
  @Test
  void getVersionReturnsDetail() throws Exception {
    when(userService.authenticateToken("tkn")).thenReturn(1L);
    SearchRecord record = new SearchRecord();
    User user = new User();
    user.setId(1L);
    record.setId(10L);
    record.setUser(user);
    SearchResultVersion version = new SearchResultVersion();
    version.setId(8L);
    version.setSearchRecord(record);
    version.setUser(user);
    version.setTerm("term");
    version.setLanguage(Language.ENGLISH);
    version.setFlavor(DictionaryFlavor.BILINGUAL);
    version.setModel("model-y");
    version.setVersionNumber(3);
    version.setContent("full content");
    version.setPreview("full");
    version.setCreatedAt(LocalDateTime.now());

    when(searchResultService.getVersionDetail(eq(1L), eq(10L), eq(8L))).thenReturn(version);

    mockMvc
        .perform(get("/api/words/10/versions/8").header("X-USER-TOKEN", "tkn"))
        .andExpect(status().isOk())
        .andExpect(content().string(containsString("model-y")))
        .andExpect(content().string(containsString("full content")));
  }
}
