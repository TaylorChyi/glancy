package com.glancy.backend.service.support;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * 背景：
 *  - 搜索记录分页参数此前直接散落在控制器与服务层，出现 page/size 校验重复的问题。
 * 目的：
 *  - 通过值对象统一封装分页参数的归一化逻辑，并暴露 PageRequest 转换入口。
 * 关键决策与取舍：
 *  - 采用记录类型保持不可变特性，确保分页参数一旦创建即具备确定性；
 *  - 内部提供工厂方法承担边界校验，相比在调用处手动处理更符合领域模型；
 *    若继续在各处手动 clamp 数值，将导致规则分散且难以复用。
 * 影响范围：
 *  - SearchRecordController 与 SearchRecordService 将依赖该值对象，避免重复校验代码。
 * 演进与TODO：
 *  - 如未来扩展游标分页，可在此新增 fromCursor 工厂并扩展字段表示游标信息。
 */
public record SearchRecordPageRequest(int page, int size) {
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    public static SearchRecordPageRequest firstPage() {
        return new SearchRecordPageRequest(0, DEFAULT_SIZE);
    }

    public static SearchRecordPageRequest of(Integer page, Integer size) {
        int safePage = page == null ? 0 : Math.max(page, 0);
        int requestedSize = size == null ? DEFAULT_SIZE : size;
        int safeSize = Math.min(Math.max(requestedSize, 1), MAX_SIZE);
        return new SearchRecordPageRequest(safePage, safeSize);
    }

    public Pageable toPageable(Sort sort) {
        Sort resolvedSort = sort == null ? Sort.unsorted() : sort;
        return PageRequest.of(page, size, resolvedSort);
    }
}
