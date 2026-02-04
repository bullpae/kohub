package com.kohub.domain.terminal.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
     * 명령어 로그 (원본)
     */
    @Column(name = "command_log", columnDefinition = "TEXT")
    private String commandLog;

    /**
     * 명령어 수
     */
    @Column(name = "command_count")
    @Builder.Default
    private int commandCount = 0;

    /**
     * 추출된 명령어 목록 (JSON)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "commands", columnDefinition = "jsonb")
    private List<String> commands;

    /**
     * 태그 (검색용)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "tags", columnDefinition = "jsonb")
    private List<String> tags;

    /**
     * 세션 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

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

    /**
     * 세션 상태 enum
     */
    public enum SessionStatus {
        ACTIVE, ENDED, FAILED
    }

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
        this.status = SessionStatus.ENDED;
        
        // 명령어 추출 및 분석
        parseCommands();
    }

    /**
     * 티켓 연결
     */
    public void linkToTicket(UUID ticketId) {
        this.ticketId = ticketId;
    }

    /**
     * 세션 실패 처리
     */
    public void markAsFailed(String errorLog) {
        if (errorLog != null) {
            appendLog("ERROR: " + errorLog);
        }
        this.endedAt = LocalDateTime.now();
        this.status = SessionStatus.FAILED;
    }

    /**
     * 명령어 파싱 및 태그 추출
     */
    public void parseCommands() {
        if (this.commandLog == null || this.commandLog.isBlank()) {
            return;
        }

        // 프롬프트 패턴으로 명령어 추출
        Pattern commandPattern = Pattern.compile("^\\$\\s*(.+)$|^#\\s*(.+)$", Pattern.MULTILINE);
        Matcher matcher = commandPattern.matcher(this.commandLog);

        List<String> extractedCommands = new ArrayList<>();
        Set<String> extractedTags = new HashSet<>();

        while (matcher.find()) {
            String cmd = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
            if (cmd != null && !cmd.isBlank()) {
                extractedCommands.add(cmd.trim());
                
                // 명령어에서 태그 추출
                extractedTags.addAll(extractTags(cmd));
            }
        }

        this.commands = extractedCommands;
        this.commandCount = extractedCommands.size();
        this.tags = new ArrayList<>(extractedTags);
    }

    /**
     * 명령어에서 태그 추출
     */
    private Set<String> extractTags(String command) {
        Set<String> tags = new HashSet<>();
        
        // 주요 명령어 태그
        if (command.startsWith("systemctl ") || command.startsWith("service ")) {
            tags.add("서비스관리");
        }
        if (command.contains("docker") || command.contains("podman")) {
            tags.add("컨테이너");
        }
        if (command.contains("kubectl") || command.contains("k8s")) {
            tags.add("쿠버네티스");
        }
        if (command.startsWith("vim ") || command.startsWith("nano ") || command.startsWith("vi ")) {
            tags.add("편집");
        }
        if (command.startsWith("tail ") || command.startsWith("less ") || command.contains("log")) {
            tags.add("로그");
        }
        if (command.startsWith("netstat") || command.startsWith("ss ") || command.startsWith("curl ") || command.startsWith("ping ")) {
            tags.add("네트워크");
        }
        if (command.startsWith("ps ") || command.startsWith("top") || command.startsWith("htop")) {
            tags.add("프로세스");
        }
        if (command.startsWith("df ") || command.startsWith("du ") || command.startsWith("ls ")) {
            tags.add("파일시스템");
        }
        if (command.contains("restart") || command.contains("reload")) {
            tags.add("재시작");
        }
        if (command.contains("error") || command.contains("fail")) {
            tags.add("오류");
        }

        return tags;
    }

    /**
     * 세션 지속 시간 (초)
     */
    public Long getDurationSeconds() {
        if (startedAt == null) return null;
        LocalDateTime end = endedAt != null ? endedAt : LocalDateTime.now();
        return Duration.between(startedAt, end).getSeconds();
    }

    /**
     * 특정 명령어 포함 여부
     */
    public boolean containsCommand(String keyword) {
        if (commands == null) return false;
        return commands.stream().anyMatch(cmd -> cmd.contains(keyword));
    }
}
