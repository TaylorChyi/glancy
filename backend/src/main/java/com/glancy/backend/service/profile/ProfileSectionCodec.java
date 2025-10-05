package com.glancy.backend.service.profile;

import com.glancy.backend.dto.ProfileCustomSectionDto;
import java.util.List;

/**
 * 背景：
 *  - 个性化画像的自定义大项需支持不同存储形态，直接在服务层拼接 JSON 会导致未来难以扩展。
 * 目的：
 *  - 抽象出编解码接口，通过策略模式允许切换 JSON、关系型等不同实现，同时集中处理异常。
 * 关键决策与取舍：
 *  - 采用 Strategy 模式隔离序列化策略；当前提供 JSON 实现，后续可引入数据库表实现时替换 Bean。
 * 影响范围：
 *  - UserProfileService 通过该接口读写持久化字段，避免与具体格式耦合。
 * 演进与TODO：
 *  - TODO: 若需支持版本化，可在接口中增加 `deserialize` 的上下文参数携带版本信息。
 */
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
