package com.glancy.backend.service.profile;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.ProfileCustomSectionDto;
import com.glancy.backend.dto.ProfileCustomSectionItemDto;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JsonProfileSectionCodecTest {

    private JsonProfileSectionCodec codec;

    @BeforeEach
    void setUp() {
        codec = new JsonProfileSectionCodec(new ObjectMapper());
    }

    /**
     * 测试目标：验证正常场景下 JSON 序列化与反序列化保持信息完整。
     * 前置条件：构造包含一个大项与两个小项的列表。
     * 步骤：
     *  1) 调用 serialize 获取 JSON；
     *  2) 调用 deserialize 还原列表。
     * 断言：
     *  - 反序列化后列表长度与标题保持一致；
     *  - 小项内容与原始值一致。
     * 边界/异常：若未来引入版本字段，此处需补充兼容性用例。
     */
    @Test
    void serializeAndDeserializeRoundTrip() {
        List<ProfileCustomSectionDto> sections = List.of(
            new ProfileCustomSectionDto(
                "职业规划",
                List.of(
                    new ProfileCustomSectionItemDto("当前项目", "AI 教练"),
                    new ProfileCustomSectionItemDto("目标技能", "同声传译")
                )
            )
        );

        String payload = codec.serialize(sections);
        assertNotNull(payload);

        List<ProfileCustomSectionDto> restored = codec.deserialize(payload);
        assertEquals(1, restored.size(), "section size should match");
        assertEquals("职业规划", restored.get(0).title());
        assertEquals(2, restored.get(0).items().size());
        assertEquals("AI 教练", restored.get(0).items().get(0).value());
    }

    /**
     * 测试目标：确保空列表序列化后返回 null，反序列化 null 或空串时返回空列表。
     * 前置条件：提供空集合与空字符串。
     * 步骤：
     *  1) 调用 serialize(List.of());
     *  2) 分别调用 deserialize(null) 与 deserialize("").
     * 断言：均返回空列表。
     * 边界/异常：若后续需要区分「未保存」与「已保存为空」，可在 codec 中引入标记串。
     */
    @Test
    void handleEmptyPayload() {
        assertNull(codec.serialize(List.of()), "empty list should serialize to null");
        assertTrue(codec.deserialize(null).isEmpty(), "null payload should become empty list");
        assertTrue(codec.deserialize(" ").isEmpty(), "blank payload should become empty list");
    }
}
