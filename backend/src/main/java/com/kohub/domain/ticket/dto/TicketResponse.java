package com.kohub.domain.ticket.dto;

import com.kohub.domain.ticket.entity.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * 티켓 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketResponse {

    private UUID id;
    private String title;
    private String description;
    private TicketSource source;
    private String sourceEventId;
    private TicketStatus status;
    private TicketPriority priority;
    private UUID hostId;
    private UUID reporterId;
    private UUID assigneeId;
    private UUID organizationId;
    private String resolutionSummary;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant resolvedAt;

    /**
     * Entity -> DTO 변환
     */
    public static TicketResponse from(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .source(ticket.getSource())
                .sourceEventId(ticket.getSourceEventId())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .hostId(ticket.getHostId())
                .reporterId(ticket.getReporterId())
                .assigneeId(ticket.getAssigneeId())
                .organizationId(ticket.getOrganizationId())
                .resolutionSummary(ticket.getResolutionSummary())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .build();
    }
}
