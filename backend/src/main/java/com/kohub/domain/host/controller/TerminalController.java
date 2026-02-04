package com.kohub.domain.host.controller;

import com.kohub.adapter.termix.TermixAdapter;
import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.common.response.ApiResponse;
import com.kohub.domain.host.entity.Host;
import com.kohub.domain.host.repository.HostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 터미널 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/hosts/{hostId}/terminal")
@RequiredArgsConstructor
public class TerminalController {

    private final HostRepository hostRepository;
    private final TermixAdapter termixAdapter;

    /**
     * 터미널 URL 생성
     */
    @GetMapping("/url")
    public ApiResponse<TermixAdapter.TerminalUrlResponse> getTerminalUrl(
            @PathVariable UUID hostId,
            @RequestParam(required = false) UUID ticketId) {
        
        Host host = hostRepository.findById(hostId)
                .orElseThrow(() -> new BusinessException(ErrorCode.HOST_NOT_FOUND));
        
        // TODO: 현재 사용자 ID 가져오기 (인증 연동 후)
        UUID userId = null;
        
        var response = termixAdapter.getTerminalUrl(host, ticketId, userId);
        return ApiResponse.success(response);
    }

    /**
     * 세션 로그 조회
     */
    @GetMapping("/logs/{sessionId}")
    public ApiResponse<TermixAdapter.TerminalLogResponse> getSessionLog(
            @PathVariable UUID hostId,
            @PathVariable String sessionId) {
        
        // 호스트 존재 확인
        if (!hostRepository.existsById(hostId)) {
            throw new BusinessException(ErrorCode.HOST_NOT_FOUND);
        }
        
        var response = termixAdapter.getSessionLog(sessionId);
        return ApiResponse.success(response);
    }
}
