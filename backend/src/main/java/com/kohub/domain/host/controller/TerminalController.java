package com.kohub.domain.host.controller;

import com.kohub.adapter.termix.TermixAdapter;
import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.common.response.ApiResponse;
import com.kohub.domain.host.entity.Host;
import com.kohub.domain.host.repository.HostRepository;
import com.kohub.domain.terminal.dto.TerminalLogResponse;
import com.kohub.domain.terminal.service.TerminalLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 터미널 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/hosts/{hostId}/terminal")
@RequiredArgsConstructor
@Tag(name = "Terminal", description = "터미널 세션 관리 API")
public class TerminalController {

    private final HostRepository hostRepository;
    private final TermixAdapter termixAdapter;
    private final TerminalLogService terminalLogService;

    /**
     * 터미널 URL 생성 및 세션 시작
     */
    @GetMapping("/url")
    @Operation(summary = "터미널 URL 생성", description = "호스트 접속을 위한 터미널 URL을 생성합니다")
    public ApiResponse<TerminalUrlWithSession> getTerminalUrl(
            @PathVariable UUID hostId,
            @RequestParam(required = false) UUID ticketId) {
        
        Host host = hostRepository.findById(hostId)
                .orElseThrow(() -> new BusinessException(ErrorCode.HOST_NOT_FOUND));
        
        // TODO: 현재 사용자 ID 가져오기 (인증 연동 후)
        UUID userId = null;
        
        var terminalUrl = termixAdapter.getTerminalUrl(host, ticketId, userId);
        
        // 세션 로그 기록 시작
        var sessionLog = terminalLogService.startSession(
                hostId, ticketId, userId, terminalUrl.sessionId());
        
        return ApiResponse.success(new TerminalUrlWithSession(
                terminalUrl.url(),
                terminalUrl.sessionId(),
                sessionLog.getId(),
                terminalUrl.hostId(),
                terminalUrl.hostName(),
                terminalUrl.sshHost(),
                terminalUrl.sshPort(),
                terminalUrl.sshUser()
        ));
    }

    /**
     * 세션 로그 조회
     */
    @GetMapping("/logs/{sessionId}")
    @Operation(summary = "세션 로그 조회", description = "터미널 세션의 로그를 조회합니다")
    public ApiResponse<TerminalLogResponse> getSessionLog(
            @PathVariable UUID hostId,
            @PathVariable String sessionId) {
        
        // 호스트 존재 확인
        if (!hostRepository.existsById(hostId)) {
            throw new BusinessException(ErrorCode.HOST_NOT_FOUND);
        }
        
        var response = terminalLogService.getBySessionId(sessionId);
        return ApiResponse.success(response);
    }

    /**
     * 세션 종료
     */
    @PostMapping("/logs/{sessionId}/end")
    @Operation(summary = "세션 종료", description = "터미널 세션을 종료하고 로그를 저장합니다")
    public ApiResponse<TerminalLogResponse> endSession(
            @PathVariable UUID hostId,
            @PathVariable String sessionId) {
        
        var response = terminalLogService.endSession(sessionId);
        return ApiResponse.success(response);
    }

    /**
     * 호스트 터미널 로그 목록
     */
    @GetMapping("/logs")
    @Operation(summary = "터미널 로그 목록", description = "호스트의 터미널 세션 로그 목록을 조회합니다")
    public ApiResponse<Page<TerminalLogResponse.Summary>> getHostLogs(
            @PathVariable UUID hostId,
            @PageableDefault(size = 20) Pageable pageable) {
        
        var response = terminalLogService.getByHost(hostId, pageable);
        return ApiResponse.success(response);
    }

    /**
     * 터미널 URL + 세션 응답
     */
    public record TerminalUrlWithSession(
            String url,
            String sessionId,
            UUID logId,
            UUID hostId,
            String hostName,
            String sshHost,
            int sshPort,
            String sshUser
    ) {}
}
