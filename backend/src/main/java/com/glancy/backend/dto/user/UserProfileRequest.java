/**
 * 背景：
 *  - 用户画像保存 DTO 与其他领域混杂，长期导致资料演进缺乏清晰边界；
 *    此外早期实现使用可变 POJO 带来演进风险。
 * 目的：
 *  - 在 user 包内提供不可变的画像保存请求，配合 Jackson 绑定确保资料场景聚合。
 * 关键决策与取舍：
 *  - 采用 record 与 {@link JsonIgnoreProperties} 兼顾不可变性与历史兼容。
 * 影响范围：
 *  - UserProfileService 及控制器导入路径调整。
 * 演进与TODO：
 *  - TODO: 若画像字段继续扩展，需评估版本化或特性开关策略。
 */
package com.glancy.backend.dto.user;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

/**
 * 背景：
 *  - 用户画像保存接口曾使用可变的 Lombok POJO，字段删除后仍保留 setter 容易产生并发与演进风险。
 * 目的：
 *  - 以不可变 record 承载保存画像所需字段，配合 Jackson 自动绑定确保序列化安全。
 * 关键决策与取舍：
 *  - 选择 record 而非传统类，借助 Java 平台的不可变语义提升线程安全并简化序列化；
 *    同时保留 {@link JsonIgnoreProperties} 以兼容历史客户端冗余字段。
 * 影响范围：
 *  - `UserProfileService` 及控制器使用访问器方法替换原有 setter/getter。
 * 演进与TODO：
 *  - TODO: 若后续画像字段扩展，请评估版本化需求或新增可选配置对象。
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record UserProfileRequest(
    /** 用户当前的职业角色描述 */
    String job,
    /** 用户填写的兴趣标签，使用分隔符拆分 */
    String interest,
    /** 学习或使用目标说明 */
    String goal,
    /** 用户当前的学历背景 */
    String education,
    /** 对自身能力水平的描述 */
    String currentAbility,
    /** 每日词汇目标，单位：个 */
    Integer dailyWordTarget,
    /** 对未来规划或学习节奏的补充描述 */
    String futurePlan,
    /** 首选的释义回应语气 */
    String responseStyle,
    /** 用户自定义维度的配置集合 */
    List<ProfileCustomSectionDto> customSections
) {}
