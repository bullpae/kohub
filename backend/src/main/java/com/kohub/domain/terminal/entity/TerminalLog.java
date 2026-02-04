package com.kohub.domain.terminal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 터미널 세션 로그 엔티티
 */
@Entity
@Table(name = "terminal_logs")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class TerminalLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 관련 티켓 ID (선택적)
     */
    @Column(name = "ticket_id")
    private UUID ticketId;

    /**
     * 대상 호스트 ID
     */
    @Column(name = "host_id", nullable = false)
    private UUID hostId;

    /**
     * 접속 사용자 ID
     */
    @Column(name = "user_id")
    private UUID userId;

    /**
     * 터미널 세션 ID
     */
    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    /**
     * 명령어 로그
     */
    @Column(name = "command_log", columnDefinition = "TEXT")
    private String commandLog;

    /**
     * 세션 시작 시간
     */
    @CreationTimestamp
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    /**
     * 세션 종료 시간
     */
    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    // === Business Methods ===

    /**
     * 로그 추가
     */
    public void appendLog(String log) {
        if (this.commandLog == null) {
            this.commandLog = log;
        } else {
            this.commandLog = this.commandLog + "\n" + log;
        }
    }

    /**
     * 세션 종료
     */
    public void endSession(String finalLog) {
        if (finalLog != null) {
            appendLog(finalLog);
        }
        this.endedAt = LocalDateTime.now();
    }

    /**
     * 티켓 연결
     */
    public void linkToTicket(UUID ticketId) {
        this.ticketId = ticketId;
    }
}
