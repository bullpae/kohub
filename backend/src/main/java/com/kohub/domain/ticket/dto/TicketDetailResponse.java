package com.kohub.domain.ticket.dto;

import com.kohub.domain.ticket.entity.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * 티켓 상세 응답 DTO (활동 기록 포함)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketDetailResponse {

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
    private List<ActivityResponse> activities;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant resolvedAt;

    /**
     * 활동 응답 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActivityResponse {
        private UUID id;
        private ActivityType type;
        private String content;
        private UUID actorId;
        private Instant createdAt;

        public static ActivityResponse from(Activity activity) {
            return ActivityResponse.builder()
                    .id(activity.getId())
                    .type(activity.getType())
                    .content(activity.getContent())
                    .actorId(activity.getActorId())
                    .createdAt(activity.getCreatedAt())
                    .build();
        }
    }

    /**
     * Entity -> DTO 변환
     */
    public static TicketDetailResponse from(Ticket ticket) {
        return TicketDetailResponse.builder()
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
                .activities(ticket.getActivities().stream()
                        .map(ActivityResponse::from)
                        .toList())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .build();
    }
}
