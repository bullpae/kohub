package com.kohub.domain.ticket.entity;

import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 티켓 엔티티
 * 장애/요청 이력을 관리한다.
 */
@Entity
@Table(name = "tickets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketSource source = TicketSource.MANUAL;

    @Column(name = "source_event_id", length = 100)
    private String sourceEventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketStatus status = TicketStatus.NEW;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Column(name = "host_id")
    private UUID hostId;

    @Column(name = "reporter_id")
    private UUID reporterId;

    @Column(name = "assignee_id")
    private UUID assigneeId;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "resolution_summary", columnDefinition = "TEXT")
    private String resolutionSummary;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Activity> activities = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * 티켓 정보 수정
     */
    public void update(String title, String description, TicketPriority priority) {
        this.title = title;
        this.description = description;
        this.priority = priority;
    }

    /**
     * 상태 전이
     */
    public void transitionTo(TicketStatus newStatus, String reason, UUID actorId) {
        if (!this.status.canTransitionTo(newStatus)) {
            throw new BusinessException(ErrorCode.TICKET_INVALID_STATUS_TRANSITION);
        }

        TicketStatus oldStatus = this.status;
        this.status = newStatus;

        // 해결 시 시간 기록
        if (newStatus == TicketStatus.RESOLVED) {
            this.resolvedAt = Instant.now();
        }

        // 활동 기록 추가
        addActivity(ActivityType.STATUS_CHANGE, 
                String.format("상태 변경: %s → %s%s", oldStatus, newStatus, 
                        reason != null ? " (" + reason + ")" : ""),
                actorId);
    }

    /**
     * 담당자 배정
     */
    public void assign(UUID assigneeId, UUID actorId) {
        this.assigneeId = assigneeId;
        
        // 상태가 RECEIVED면 ASSIGNED로 전이
        if (this.status == TicketStatus.RECEIVED) {
            this.status = TicketStatus.ASSIGNED;
        }

        addActivity(ActivityType.ASSIGNMENT, "담당자 배정", actorId);
    }

    /**
     * 접수 처리
     */
    public void receive(UUID actorId) {
        transitionTo(TicketStatus.RECEIVED, "접수 완료", actorId);
    }

    /**
     * 해결 처리
     */
    public void resolve(String resolutionSummary, UUID actorId) {
        if (this.status != TicketStatus.IN_PROGRESS && this.status != TicketStatus.PENDING) {
            throw new BusinessException(ErrorCode.TICKET_INVALID_STATUS_TRANSITION);
        }

        this.resolutionSummary = resolutionSummary;
        this.status = TicketStatus.RESOLVED;
        this.resolvedAt = Instant.now();

        addActivity(ActivityType.STATUS_CHANGE, "해결 처리: " + resolutionSummary, actorId);
    }

    /**
     * 활동 추가
     */
    public void addActivity(ActivityType type, String content, UUID actorId) {
        Activity activity = Activity.builder()
                .ticket(this)
                .type(type)
                .content(content)
                .actorId(actorId)
                .build();
        this.activities.add(activity);
    }

    /**
     * 코멘트 추가
     */
    public void addComment(String content, UUID actorId) {
        addActivity(ActivityType.COMMENT, content, actorId);
    }
}
