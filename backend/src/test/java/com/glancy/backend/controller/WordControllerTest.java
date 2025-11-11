package com.glancy.backend.controller;
import org.mockito.ArgumentMatchers;
import org.mockito.Mockito;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.DictionaryFlavor;
import com.glancy.backend.entity.Language;
import com.glancy.backend.service.UserService;
import com.glancy.backend.service.WordService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(WordController.class)
@Import(
    {
        com.glancy.backend.config.security.SecurityConfig.class,
        com.glancy.backend.config.WebConfig.class,
        com.glancy.backend.config.auth.AuthenticatedUserArgumentResolver.class,
    }
)
class WordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WordService wordService;

    @MockitoBean
    private UserService userService;

    /**
     * 测试 testGetWord 接口
     */
    @Test
    void testGetWord() throws Exception {
        WordResponse resp = new WordResponse(
            "1",
            "hello",
            List.of("g"),
            Language.ENGLISH,
            "ex",
            "həˈloʊ",
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            null,
            null,
            null,
            DictionaryFlavor.BILINGUAL
        );
        Mockito.when(
            wordService.findWordForUser(
                ArgumentMatchers.eq(1L),
                ArgumentMatchers.eq("hello"),
                ArgumentMatchers.eq(Language.ENGLISH),
                ArgumentMatchers.eq(DictionaryFlavor.BILINGUAL),
                ArgumentMatchers.eq(null),
                ArgumentMatchers.eq(false),
                ArgumentMatchers.eq(true)
            )
        ).thenReturn(resp);

        Mockito.when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                get("/api/words")
                    .header("X-USER-TOKEN", "tkn")
                    .param("term", "hello")
                    .param("language", "ENGLISH")
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andDo(print())
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("1"))
            .andExpect(MockMvcResultMatchers.jsonPath("$.term").value("hello"));
    }

    /**
     * 测试携带模型参数时接口正常工作
     */
    @Test
    void testGetWordWithModel() throws Exception {
        WordResponse resp = new WordResponse(
            "1",
            "hello",
            List.of("g"),
            Language.ENGLISH,
            "ex",
            "həˈloʊ",
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            null,
            null,
            null,
            DictionaryFlavor.BILINGUAL
        );
        Mockito.when(
            wordService.findWordForUser(
                ArgumentMatchers.eq(1L),
                ArgumentMatchers.eq("hello"),
                ArgumentMatchers.eq(Language.ENGLISH),
                ArgumentMatchers.eq(DictionaryFlavor.BILINGUAL),
                ArgumentMatchers.eq("doubao"),
                ArgumentMatchers.eq(false),
                ArgumentMatchers.eq(true)
            )
        ).thenReturn(resp);

        Mockito.when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                get("/api/words")
                    .header("X-USER-TOKEN", "tkn")
                    .param("term", "hello")
                    .param("language", "ENGLISH")
                    .param("model", "doubao")
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andDo(print())
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("1"));
    }

    /**
     * 测试 testGetWordMissingTerm 接口
     */
    @Test
    void testGetWordMissingTerm() throws Exception {
        Mockito.when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(get("/api/words").header("X-USER-TOKEN", "tkn").param("language", "ENGLISH"))
            .andDo(print())
            .andExpect(MockMvcResultMatchers.status().isBadRequest())
            .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Missing required parameter: term"));
    }

    /**
     * 测试 testGetWordInvalidLanguage 接口
     */
    @Test
    void testGetWordInvalidLanguage() throws Exception {
        Mockito.when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                get("/api/words").header("X-USER-TOKEN", "tkn").param("term", "hello").param("language", "INVALID")
            )
            .andDo(print())
            .andExpect(MockMvcResultMatchers.status().isBadRequest())
            .andExpect(MockMvcResultMatchers.jsonPath("$.message").value("Invalid value for parameter: language"));
    }

    /**
     * Test access with token query parameter.
     */
    @Test
    void testGetWordTokenQueryParam() throws Exception {
        WordResponse resp = new WordResponse(
            "1",
            "hi",
            List.of("g"),
            Language.ENGLISH,
            "ex",
            "h\u0259\u02c8lo\u028a",
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            null,
            null,
            null,
            DictionaryFlavor.BILINGUAL
        );
        Mockito.when(
            wordService.findWordForUser(
                ArgumentMatchers.eq(1L),
                ArgumentMatchers.eq("hi"),
                ArgumentMatchers.eq(Language.ENGLISH),
                ArgumentMatchers.eq(DictionaryFlavor.BILINGUAL),
                ArgumentMatchers.eq(null),
                ArgumentMatchers.eq(false),
                ArgumentMatchers.eq(true)
            )
        ).thenReturn(resp);

        Mockito.when(userService.authenticateToken("tkn")).thenReturn(1L);

        mockMvc
            .perform(
                get("/api/words")
                    .param("token", "tkn")
                    .param("term", "hi")
                    .param("language", "ENGLISH")
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.term").value("hi"));
    }

    /**
     * 测试目标：验证 captureHistory 参数可关闭历史记录。\
     * 前置条件：模拟鉴权成功。\
     * 步骤：\
     *  1) 携带 captureHistory=false 发起请求。\
     * 断言：\
     *  - 服务层接收到 false。\
     * 边界/异常：覆盖禁用历史采集路径。\
     */
    @Test
    void testGetWordWithCaptureHistoryDisabled() throws Exception {
        Mockito.when(userService.authenticateToken("tkn")).thenReturn(1L);
        WordResponse resp = new WordResponse(
            "1",
            "hello",
            List.of("g"),
            Language.ENGLISH,
            "ex",
            "həˈloʊ",
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            List.of(),
            null,
            null,
            null,
            DictionaryFlavor.BILINGUAL
        );
        Mockito.when(
            wordService.findWordForUser(
                ArgumentMatchers.eq(1L),
                ArgumentMatchers.eq("hello"),
                ArgumentMatchers.eq(Language.ENGLISH),
                ArgumentMatchers.eq(DictionaryFlavor.BILINGUAL),
                ArgumentMatchers.isNull(),
                ArgumentMatchers.eq(false),
                ArgumentMatchers.eq(false)
            )
        ).thenReturn(resp);

        mockMvc
            .perform(
                get("/api/words")
                    .header("X-USER-TOKEN", "tkn")
                    .param("term", "hello")
                    .param("language", "ENGLISH")
                    .param("captureHistory", "false")
                    .accept(MediaType.APPLICATION_JSON)
            )
            .andExpect(MockMvcResultMatchers.status().isOk())
            .andExpect(MockMvcResultMatchers.jsonPath("$.id").value("1"));

        Mockito.verify(wordService, Mockito.times(1)).findWordForUser(
            ArgumentMatchers.eq(1L),
            ArgumentMatchers.eq("hello"),
            ArgumentMatchers.eq(Language.ENGLISH),
            ArgumentMatchers.eq(DictionaryFlavor.BILINGUAL),
            ArgumentMatchers.isNull(),
            ArgumentMatchers.eq(false),
            ArgumentMatchers.eq(false)
        );
    }
}
