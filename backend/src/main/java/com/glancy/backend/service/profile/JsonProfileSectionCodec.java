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

@Slf4j
@Component
public class JsonProfileSectionCodec implements ProfileSectionCodec {

    private static final TypeReference<List<ProfileCustomSectionDto>> TYPE =
            new TypeReference<List<ProfileCustomSectionDto>>() {};

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
