package com.glancy.backend.service.profile;

import com.glancy.backend.dto.ProfileCustomSectionDto;
import java.util.List;

public interface ProfileSectionCodec {
    /**
     * 将自定义大项列表序列化为可持久化的文本表示。
     *
     * @param sections 前端上传的自定义配置集合
     * @return 序列化后的文本；若集合为空返回 null，表示数据库中不占空间
     */
    String serialize(List<ProfileCustomSectionDto> sections);

    /**
     * 将持久化文本反序列化为自定义大项列表。
     *
     * @param payload 数据库存储的原始文本
     * @return 解析出的自定义大项列表，至少返回空列表
     */
    List<ProfileCustomSectionDto> deserialize(String payload);
}
