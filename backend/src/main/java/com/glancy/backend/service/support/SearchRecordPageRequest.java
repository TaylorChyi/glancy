package com.glancy.backend.service.support;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

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
