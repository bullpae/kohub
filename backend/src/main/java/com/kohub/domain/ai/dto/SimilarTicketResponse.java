package com.kohub.domain.ai.dto;

import com.kohub.domain.ticket.entity.Ticket;
import com.kohub.domain.ticket.entity.TicketPriority;
import com.kohub.domain.ticket.entity.TicketStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * 유사 티켓 응답
 */
@Getter
@Builder
public class SimilarTicketResponse {

    private UUID id;
    private String title;
    private String description;
    private TicketStatus status;
    private TicketPriority priority;
    private String resolutionSummary;
    private Instant createdAt;
    private Instant resolvedAt;
    
    /**
     * 유사도 점수 (0.0 ~ 1.0)
     */
    private double similarity;

    /**
     * 유사한 키워드
     */
    private String matchedKeywords;

    public static SimilarTicketResponse from(Ticket ticket, double similarity, String matchedKeywords) {
        return SimilarTicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .resolutionSummary(ticket.getResolutionSummary())
                .createdAt(ticket.getCreatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .similarity(similarity)
                .matchedKeywords(matchedKeywords)
                .build();
    }
}
