package com.glancy.backend.service.profile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glancy.backend.dto.ProfileSectionDto;
import com.glancy.backend.dto.ProfileSectionItemDto;
import java.util.List;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

/**
 * 背景：
 *  - 自定义区块以 JSON 字符串持久化，需要在服务层提供统一的编解码逻辑。
 * 目的：
 *  - 通过适配器模式集中处理 JSON ↔ DTO 转换，避免在服务层散落序列化细节。
 * 关键决策与取舍：
 *  - 复用 Spring 管理的 {@link ObjectMapper}，保持全局序列化配置一致；
 *  - 在清洗阶段剔除空白字段，保证落库数据紧凑且语义明确。
 * 影响范围：
 *  - `UserProfileService` 依赖此组件在保存与读取时转换自定义区块。
 * 演进与TODO：
 *  - TODO: 后续可在此扩展 Schema 校验或版本控制能力。
 */
@Component
public class ProfileSectionCodec {

    private static final Logger log = LoggerFactory.getLogger(ProfileSectionCodec.class);

    private static final TypeReference<List<ProfileSectionDto>> SECTION_LIST_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    public ProfileSectionCodec(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * 将数据库中的 JSON 字符串转换为不可变的区块列表。
     */
    public List<ProfileSectionDto> decode(String json) {
        if (!StringUtils.hasText(json)) {
            return List.of();
        }
        try {
            List<ProfileSectionDto> sections = objectMapper.readValue(json, SECTION_LIST_TYPE);
            if (CollectionUtils.isEmpty(sections)) {
                return List.of();
            }
            return sections
                .stream()
                .filter(Objects::nonNull)
                .map(ProfileSectionCodec::sanitizeSection)
                .filter(section -> section.id() != null)
                .toList();
        } catch (JsonProcessingException ex) {
            log.error("Failed to decode profile custom sections", ex);
            throw new IllegalStateException("无法解析个性化自定义区块", ex);
        }
    }

    /**
     * 将区块列表编码为 JSON 字符串，供实体持久化使用。
     */
    public String encode(List<ProfileSectionDto> sections) {
        if (CollectionUtils.isEmpty(sections)) {
            return null;
        }
        List<ProfileSectionDto> sanitized = sections
            .stream()
            .filter(Objects::nonNull)
            .map(ProfileSectionCodec::sanitizeSection)
            .filter(section -> section.id() != null)
            .toList();
        if (sanitized.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(sanitized);
        } catch (JsonProcessingException ex) {
            log.error("Failed to encode profile custom sections", ex);
            throw new IllegalStateException("无法保存个性化自定义区块", ex);
        }
    }

    private static ProfileSectionDto sanitizeSection(ProfileSectionDto section) {
        String id = normalizeKey(section.id());
        String title = normalizeText(section.title());
        List<ProfileSectionItemDto> items = sanitizeItems(section.items());
        return new ProfileSectionDto(id, title, items);
    }

    private static List<ProfileSectionItemDto> sanitizeItems(List<ProfileSectionItemDto> items) {
        if (CollectionUtils.isEmpty(items)) {
            return List.of();
        }
        return items
            .stream()
            .filter(Objects::nonNull)
            .map(item ->
                new ProfileSectionItemDto(
                    normalizeKey(item.id()),
                    normalizeText(item.label()),
                    normalizeText(item.value())
                )
            )
            .filter(item -> item.id() != null)
            .toList();
    }

    private static String normalizeKey(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private static String normalizeText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
