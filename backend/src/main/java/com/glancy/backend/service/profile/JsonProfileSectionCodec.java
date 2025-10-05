package com.glancy.backend.service.profile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.ProfileCustomSectionDto;
import java.io.IOException;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - 短期内仍使用单表存储自定义画像信息，需要可靠的 JSON 编解码器以避免手写拼接。
 * 目的：
 *  - 基于 Spring 注入的 {@link ObjectMapper} 提供线程安全的 JSON 序列化，实现 {@link ProfileSectionCodec}。
 * 关键决策与取舍：
 *  - 复用 Jackson 避免重复轮子，并在序列化失败时抛出非法状态异常，交由上层统一告警。
 * 影响范围：
 *  - UserProfileService 通过该实现读写数据库字段，实现切换时只需替换 Bean。
 * 演进与TODO：
 *  - TODO: 若迁移至专用表或文档库，可新增实现并通过配置替换，不影响调用方代码。
 */
@Slf4j
@Component
public class JsonProfileSectionCodec implements ProfileSectionCodec {

    private static final TypeReference<List<ProfileCustomSectionDto>> TYPE = new TypeReference<
        List<ProfileCustomSectionDto>
    >() {};

    private final ObjectMapper objectMapper;

    public JsonProfileSectionCodec(ObjectMapper objectMapper) {
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper");
    }

    @Override
    public String serialize(List<ProfileCustomSectionDto> sections) {
        if (sections == null || sections.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(sections);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize profile custom sections", e);
            throw new IllegalStateException("无法序列化自定义画像字段", e);
        }
    }

    @Override
    public List<ProfileCustomSectionDto> deserialize(String payload) {
        if (payload == null || payload.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(payload, TYPE);
        } catch (IOException e) {
            log.error("Failed to deserialize profile custom sections", e);
            throw new IllegalStateException("无法解析自定义画像字段", e);
        }
    }
}
