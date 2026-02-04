package com.kohub.domain.terminal.service;

import com.kohub.adapter.termix.TermixAdapter;
import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.domain.terminal.dto.TerminalLogResponse;
import com.kohub.domain.terminal.entity.TerminalLog;
import com.kohub.domain.terminal.repository.TerminalLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 터미널 로그 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TerminalLogService {

    private final TerminalLogRepository terminalLogRepository;
    private final TermixAdapter termixAdapter;

    /**
     * 새 터미널 세션 시작 기록
     */
    @Transactional
    public TerminalLogResponse startSession(UUID hostId, UUID ticketId, UUID userId, String sessionId) {
        TerminalLog terminalLog = TerminalLog.builder()
                .hostId(hostId)
                .ticketId(ticketId)
                .userId(userId)
                .sessionId(sessionId)
                .build();

        TerminalLog saved = terminalLogRepository.save(terminalLog);
        log.info("터미널 세션 시작: sessionId={}, hostId={}", sessionId, hostId);

        return TerminalLogResponse.from(saved);
    }

    /**
     * 세션 로그 조회 (Termix에서 수집)
     */
    public TerminalLogResponse getBySessionId(String sessionId) {
        TerminalLog terminalLog = terminalLogRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "터미널 세션을 찾을 수 없습니다"));

        // Termix에서 최신 로그 조회
        var termixLog = termixAdapter.getSessionLog(sessionId);
        if (termixLog.log() != null && !termixLog.log().isEmpty()) {
            terminalLog.appendLog(termixLog.log());
        }

        return TerminalLogResponse.from(terminalLog);
    }

    /**
     * 티켓별 터미널 로그 목록
     */
    public List<TerminalLogResponse.Summary> getByTicket(UUID ticketId) {
        return terminalLogRepository.findByTicketIdOrderByStartedAtDesc(ticketId).stream()
                .map(TerminalLogResponse.Summary::from)
                .collect(Collectors.toList());
    }

    /**
     * 호스트별 터미널 로그 목록
     */
    public Page<TerminalLogResponse.Summary> getByHost(UUID hostId, Pageable pageable) {
        return terminalLogRepository.findByHostIdOrderByStartedAtDesc(hostId, pageable)
                .map(TerminalLogResponse.Summary::from);
    }

    /**
     * 세션 종료 및 로그 저장
     */
    @Transactional
    public TerminalLogResponse endSession(String sessionId) {
        TerminalLog terminalLog = terminalLogRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "터미널 세션을 찾을 수 없습니다"));

        // Termix에서 최종 로그 조회
        var termixLog = termixAdapter.getSessionLog(sessionId);
        terminalLog.endSession(termixLog.log());

        log.info("터미널 세션 종료: sessionId={}", sessionId);
        return TerminalLogResponse.from(terminalLog);
    }

    /**
     * 티켓에 세션 연결
     */
    @Transactional
    public TerminalLogResponse linkToTicket(String sessionId, UUID ticketId) {
        TerminalLog terminalLog = terminalLogRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "터미널 세션을 찾을 수 없습니다"));

        terminalLog.linkToTicket(ticketId);
        log.info("터미널 세션 → 티켓 연결: sessionId={}, ticketId={}", sessionId, ticketId);

        return TerminalLogResponse.from(terminalLog);
    }
}
