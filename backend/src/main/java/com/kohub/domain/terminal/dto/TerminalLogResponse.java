package com.kohub.domain.terminal.dto;

import com.kohub.domain.terminal.entity.TerminalLog;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 터미널 로그 응답 DTO
 */
@Getter
@Builder
public class TerminalLogResponse {
    private final UUID id;
    private final UUID ticketId;
    private final UUID hostId;
    private final UUID userId;
    private final String sessionId;
    private final String commandLog;
    private final LocalDateTime startedAt;
    private final LocalDateTime endedAt;
    private final boolean active;

    public static TerminalLogResponse from(TerminalLog log) {
        return TerminalLogResponse.builder()
                .id(log.getId())
                .ticketId(log.getTicketId())
                .hostId(log.getHostId())
                .userId(log.getUserId())
                .sessionId(log.getSessionId())
                .commandLog(log.getCommandLog())
                .startedAt(log.getStartedAt())
                .endedAt(log.getEndedAt())
                .active(log.getEndedAt() == null)
                .build();
    }

    /**
     * 요약 정보 (목록용)
     */
    @Getter
    @Builder
    public static class Summary {
        private final UUID id;
        private final String sessionId;
        private final LocalDateTime startedAt;
        private final LocalDateTime endedAt;
        private final boolean active;

        public static Summary from(TerminalLog log) {
            return Summary.builder()
                    .id(log.getId())
                    .sessionId(log.getSessionId())
                    .startedAt(log.getStartedAt())
                    .endedAt(log.getEndedAt())
                    .active(log.getEndedAt() == null)
                    .build();
        }
    }
}
