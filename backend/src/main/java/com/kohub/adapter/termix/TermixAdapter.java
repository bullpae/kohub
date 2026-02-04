package com.kohub.adapter.termix;

import com.kohub.adapter.AdapterCapability;
import com.kohub.adapter.AdapterType;
import com.kohub.adapter.ToolAdapter;
import com.kohub.domain.host.entity.Host;
import com.kohub.domain.ticket.dto.TicketRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Termix SSH 터미널 어댑터
 * 
 * 호스트에 대한 웹 터미널 접속 URL을 생성하고,
 * 세션 로그를 수집하는 기능을 제공
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TermixAdapter implements ToolAdapter {

    @Value("${kohub.termix.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${kohub.termix.api-key:}")
    private String apiKey;

    @Override
    public String getName() {
        return "termix";
    }

    @Override
    public AdapterType getType() {
        return AdapterType.TERMINAL;
    }

    @Override
    public AdapterCapability[] getCapabilities() {
        return new AdapterCapability[]{
                AdapterCapability.ACTION_EXECUTE,
                AdapterCapability.LOG_COLLECT
        };
    }

    @Override
    public Optional<TicketRequest> handleWebhook(String payload, Map<String, String> headers) {
        // Termix는 Webhook을 사용하지 않음
        return Optional.empty();
    }

    @Override
    public boolean isHealthy() {
        // TODO: Termix API 상태 확인
        return true;
    }

    /**
     * 호스트에 대한 터미널 URL 생성
     * 
     * @param host 대상 호스트
     * @param ticketId 관련 티켓 ID (로그 연결용)
     * @param userId 접속 사용자 ID
     * @return 터미널 접속 URL
     */
    public TerminalUrlResponse getTerminalUrl(Host host, UUID ticketId, UUID userId) {
        if (host.getSshConfig() == null) {
            throw new IllegalArgumentException("SSH 설정이 없는 호스트입니다: " + host.getName());
        }

        // 세션 ID 생성
        String sessionId = UUID.randomUUID().toString();
        
        // Termix URL 구성
        // 형식: {baseUrl}/terminal?host={host}&port={port}&user={user}&session={sessionId}
        String sshHost = host.getSshConfig().getHost();
        int sshPort = host.getSshConfig().getPort() != null ? host.getSshConfig().getPort() : 22;
        String sshUser = host.getSshConfig().getUsername();
        
        String terminalUrl = String.format(
                "%s/terminal?host=%s&port=%d&user=%s&session=%s&ticket=%s",
                baseUrl,
                encode(sshHost),
                sshPort,
                encode(sshUser),
                encode(sessionId),
                ticketId != null ? ticketId.toString() : ""
        );
        
        log.info("터미널 URL 생성: host={}, sessionId={}", host.getName(), sessionId);
        
        return new TerminalUrlResponse(
                terminalUrl,
                sessionId,
                host.getId(),
                host.getName(),
                sshHost,
                sshPort,
                sshUser
        );
    }

    /**
     * 세션 로그 조회
     * 
     * @param sessionId 세션 ID
     * @return 터미널 로그
     */
    public TerminalLogResponse getSessionLog(String sessionId) {
        // TODO: Termix API를 통해 실제 로그 조회
        log.info("세션 로그 조회 요청: sessionId={}", sessionId);
        
        return new TerminalLogResponse(
                sessionId,
                "# 터미널 로그 (Termix 연동 후 실제 로그로 대체)",
                null,
                null
        );
    }
    
    private String encode(String value) {
        if (value == null) return "";
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    /**
     * 터미널 URL 응답
     */
    public record TerminalUrlResponse(
            String url,
            String sessionId,
            UUID hostId,
            String hostName,
            String sshHost,
            int sshPort,
            String sshUser
    ) {}

    /**
     * 터미널 로그 응답
     */
    public record TerminalLogResponse(
            String sessionId,
            String log,
            String startedAt,
            String endedAt
    ) {}
}
