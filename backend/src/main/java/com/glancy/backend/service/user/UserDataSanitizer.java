package com.glancy.backend.service.user;

import com.glancy.backend.exception.InvalidRequestException;
import com.glancy.backend.service.AvatarStorage;
import com.glancy.backend.service.support.AvatarReferenceResolver;
import java.util.Locale;
import org.springframework.stereotype.Component;

/**
 * 背景：
 *  - UserService 中存在大量邮箱、头像等字段清洗逻辑，导致主流程噪声大、重复代码多。
 * 目的：
 *  - 以可复用的组合组件承载数据归一化逻辑，为命令/查询处理器提供统一入口。
 * 关键决策与取舍：
 *  - 选用策略化的组合方式（而非静态工具类）以便注入依赖并在未来扩展缓存或特性开关；
 *  - 放弃继承或静态工具类方案，避免测试困难与全局状态污染。
 * 影响范围：
 *  - 所有用户领域命令/查询在处理邮箱、头像、验证码时统一依赖该类。
 * 演进与TODO：
 *  - 后续可在此接入灰度策略（例如邮箱白名单），或使用特性开关定制不同租户规则。
 */
@Component
public class UserDataSanitizer {

    private final AvatarStorage avatarStorage;
    private final AvatarReferenceResolver avatarReferenceResolver;

    public UserDataSanitizer(AvatarStorage avatarStorage, AvatarReferenceResolver avatarReferenceResolver) {
        this.avatarStorage = avatarStorage;
        this.avatarReferenceResolver = avatarReferenceResolver;
    }

    /**
     * 意图：统一邮箱格式，确保大小写与空白处理一致。
     * 输入：email（可能包含空白或大写字符）。
     * 输出：去除空白且转为小写的邮箱字符串。
     * 流程：trim -> toLowerCase。
     * 错误处理：传入 null 时抛出业务异常，避免调用端出现 NPE。
     * 复杂度：O(n)。
     */
    public String normalizeEmail(String email) {
        if (email == null) {
            throw new InvalidRequestException("邮箱不能为空");
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * 意图：对验证码进行裁剪并校验合法性。
     * 输入：code（允许包含空白）。
     * 输出：去除首尾空白后的验证码。
     * 流程：判空 -> trim -> 二次判空。
     * 错误处理：若为空或仅包含空白，则抛出业务异常。
     * 复杂度：O(n)。
     */
    public String sanitizeVerificationCode(String code) {
        if (code == null) {
            throw new InvalidRequestException("验证码不能为空");
        }
        String trimmed = code.trim();
        if (trimmed.isEmpty()) {
            throw new InvalidRequestException("验证码不能为空");
        }
        return trimmed;
    }

    /**
     * 意图：将头像引用归一化为对象存储的 key。
     * 输入：reference（可能为空、URL 或对象 key）。
     * 输出：标准化后的对象 key；若为空字符串则返回 null。
     * 流程：尝试通过 resolver 解析 -> 若为空白则返回 null -> 否则抛出异常。
     * 错误处理：无法解析时抛出业务异常。
     * 复杂度：O(1)。
     */
    public String normalizeAvatar(String reference) {
        if (reference == null) {
            return null;
        }
        return avatarReferenceResolver
            .normalizeToObjectKey(reference)
            .orElseGet(() -> {
                if (reference.trim().isEmpty()) {
                    return null;
                }
                throw new InvalidRequestException("无效的头像地址");
            });
    }

    /**
     * 意图：要求头像引用必须能解析为对象 key。
     * 输入：reference（可能是 URL 或对象 key）。
     * 输出：解析后的对象 key。
     * 流程：复用 normalizeAvatar -> 判空。
     * 错误处理：解析失败或为空时抛出业务异常。
     * 复杂度：O(1)。
     */
    public String requireObjectKey(String reference) {
        String normalized = normalizeAvatar(reference);
        if (normalized == null) {
            throw new InvalidRequestException("无效的头像地址");
        }
        return normalized;
    }

    /**
     * 意图：将存储中的头像引用转换为对外可访问的 URL。
     * 输入：storedAvatar（数据库中保存的引用）。
     * 输出：外部可访问的 URL 或原值。
     * 流程：判空 -> 若已是完整 URL 则直接返回 -> 通过存储生成访问链接。
     * 错误处理：无（调用者需保证引用已校验）。
     * 复杂度：O(1)。
     */
    public String resolveOutboundAvatar(String storedAvatar) {
        if (storedAvatar == null || storedAvatar.isBlank()) {
            return storedAvatar;
        }
        if (avatarReferenceResolver.isFullUrl(storedAvatar)) {
            return storedAvatar;
        }
        return avatarStorage.resolveUrl(storedAvatar);
    }
}
