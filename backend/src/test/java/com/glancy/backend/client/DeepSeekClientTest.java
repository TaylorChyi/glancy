package com.glancy.backend.client;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.glancy.backend.dto.WordResponse;
import com.glancy.backend.entity.Language;
import io.github.cdimascio.dotenv.Dotenv;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class DeepSeekClientTest {

    private MockRestServiceServer server;
    private DeepSeekClient client;

    @BeforeEach
    void setUp() {
        RestTemplate restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();
        client = new DeepSeekClient(
            restTemplate,
            "http://mock",
            "key",
            new com.glancy.backend.llm.parser.JacksonWordResponseParser()
        );
    }

    /**
     * 测试 fetchDefinitionWithAuth 接口
     */
    @Test
    void fetchDefinitionWithAuth() {
        String content =
            "{\\\"entry\\\":\\\"hello\\\",\\\"pronunciations\\\":{\\\"英音\\\":\\\"/həˈloʊ/\\\"}," +
            "\\\"definitions\\\":[{\\\"partOfSpeech\\\":\\\"noun\\\",\\\"meanings\\\":[\\\"hi\\\"]}]}";
        String json = "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"" + content + "\"}}]}";
        server
            .expect(requestTo("http://mock/v1/chat/completions"))
            .andExpect(method(POST))
            .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer key"))
            .andExpect(content().contentType(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.messages[1].content").value("hello"))
            .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        WordResponse resp = client.fetchDefinition("hello", Language.ENGLISH);
        assertEquals("hello", resp.getTerm());
        assertEquals("noun: hi", resp.getDefinitions().get(0));
        server.verify();
    }

    /**
     * 测试 fetchDefinitionWithCodeFence 接口
     */
    @Test
    void fetchDefinitionWithCodeFence() {
        String content =
            "```json{\\\"entry\\\":\\\"hi\\\",\\\"definitions\\\":[{\\\"partOfSpeech\\\":\\\"interj.\\\"," +
            "\\\"meanings\\\":[\\\"hey\\\"]}]}```";
        String json = "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"" + content + "\"}}]}";
        server
            .expect(requestTo("http://mock/v1/chat/completions"))
            .andExpect(method(POST))
            .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        WordResponse resp = client.fetchDefinition("hi", Language.ENGLISH);
        assertEquals("hi", resp.getTerm());
        assertEquals("interj.: hey", resp.getDefinitions().get(0));
        assertEquals("ENGLISH", resp.getLanguage().name());
        server.verify();
    }

    /**
     * 测试 fetchDefinitionWithNonStandardLanguage 接口
     */
    @Test
    void fetchDefinitionWithNonStandardLanguage() {
        String content =
            "{\\\"entry\\\":\\\"\\u770B\\u770B\\\",\\\"language\\\":\\\"Chinese (Mandarin)\\\"," +
            "\\\"definitions\\\":[{\\\"partOfSpeech\\\":\\\"verb\\\",\\\"meanings\\\":[\\\"look\\\"]}]}";
        String json = "{\"choices\":[{\"message\":{\"role\":\"assistant\",\"content\":\"" + content + "\"}}]}";
        server
            .expect(requestTo("http://mock/v1/chat/completions"))
            .andExpect(method(POST))
            .andRespond(withSuccess(json, MediaType.APPLICATION_JSON));

        WordResponse resp = client.fetchDefinition("看看", Language.CHINESE);
        assertEquals(Language.CHINESE, resp.getLanguage());
        assertEquals("看看", resp.getTerm());
        assertEquals("verb: look", resp.getDefinitions().get(0));
        server.verify();
    }

    /**
     * 测试 fetchAudioWithAuth 接口
     */
    @Test
    void fetchAudioWithAuth() {
        byte[] audio = new byte[] { 1 };
        server
            .expect(requestTo("http://mock/words/audio?term=hello&language=english"))
            .andExpect(method(GET))
            .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer key"))
            .andRespond(withSuccess(audio, MediaType.APPLICATION_OCTET_STREAM));

        byte[] resp = client.fetchAudio("hello", Language.ENGLISH);
        assertArrayEquals(audio, resp);
        server.verify();
    }

    @Test
    void chatUnauthorizedThrowsException() {
        server
            .expect(requestTo("http://mock/v1/chat/completions"))
            .andExpect(method(POST))
            .andRespond(withStatus(HttpStatus.UNAUTHORIZED));

        assertThrows(com.glancy.backend.exception.UnauthorizedException.class, () ->
            client.chat(List.of(new com.glancy.backend.llm.model.ChatMessage("user", "hi")), 0.5)
        );
        server.verify();
    }

    /**
     * 测试 callDeepSeekApiExample 接口，使用 PROMPT_CN.md 的内容作为 prompt
     */
    @Test
    void callDeepSeekApiExample() throws java.io.IOException {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String key = dotenv.get("thirdparty.deepseek.api-key");
        RestTemplate rt = new RestTemplate();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (key != null && !key.isEmpty()) {
            headers.setBearerAuth(key);
        }

        // 读取 PROMPT_CN.md 文件内容
        String prompt = new ClassPathResource("prompts/english_to_chinese.txt").getContentAsString(
            StandardCharsets.UTF_8
        );

        String body = String.format(
            """
                {"model":"deepseek-chat","messages":[{"role":"system","content":%s},
                {"role":"user","content":"介绍"}],"temperature":0.7}
            """,
            // 转义 JSON 字符串
            new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(prompt)
        );
        var entity = new org.springframework.http.HttpEntity<>(body, headers);
        var response = rt.postForEntity("https://api.deepseek.com/v1/chat/completions", entity, String.class);
        System.out.println(response.getBody());
    }
}
