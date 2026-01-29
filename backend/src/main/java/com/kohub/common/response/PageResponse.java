package com.kohub.common.response;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 페이지네이션 응답 래퍼
 */
@Getter
@Builder
public class PageResponse<T> {
    
    private final List<T> data;
    private final PageInfo page;

    @Getter
    @Builder
    public static class PageInfo {
        private final int number;
        private final int size;
        private final long totalElements;
        private final int totalPages;
        private final boolean first;
        private final boolean last;
    }

    /**
     * Spring Data Page를 PageResponse로 변환
     */
    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .data(page.getContent())
                .page(PageInfo.builder()
                        .number(page.getNumber())
                        .size(page.getSize())
                        .totalElements(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .first(page.isFirst())
                        .last(page.isLast())
                        .build())
                .build();
    }
}
