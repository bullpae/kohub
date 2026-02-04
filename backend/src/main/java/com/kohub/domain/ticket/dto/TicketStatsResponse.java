package com.kohub.domain.ticket.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 티켓 통계 응답 DTO
 */
@Getter
@Builder
public class TicketStatsResponse {
    private final long total;
    private final long newCount;
    private final long inProgress;
    private final long pending;
    private final long resolved;
    private final long completed;
    private final long closed;
    private final long critical;
    private final long high;
    
    public static TicketStatsResponse of(
            long total, long newCount, long inProgress, long pending,
            long resolved, long completed, long closed, 
            long critical, long high
    ) {
        return TicketStatsResponse.builder()
                .total(total)
                .newCount(newCount)
                .inProgress(inProgress)
                .pending(pending)
                .resolved(resolved)
                .completed(completed)
                .closed(closed)
                .critical(critical)
                .high(high)
                .build();
    }
}
