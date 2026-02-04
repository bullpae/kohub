package com.kohub.domain.terminal.repository;

import com.kohub.domain.terminal.entity.TerminalLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 터미널 로그 Repository
 */
@Repository
public interface TerminalLogRepository extends JpaRepository<TerminalLog, UUID> {

    /**
     * 세션 ID로 조회
     */
    Optional<TerminalLog> findBySessionId(String sessionId);

    /**
     * 티켓별 로그 목록
     */
    List<TerminalLog> findByTicketIdOrderByStartedAtDesc(UUID ticketId);

    /**
     * 호스트별 로그 목록
     */
    Page<TerminalLog> findByHostIdOrderByStartedAtDesc(UUID hostId, Pageable pageable);

    /**
     * 사용자별 로그 목록
     */
    Page<TerminalLog> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    /**
     * 활성 세션 (종료되지 않은)
     */
    List<TerminalLog> findByEndedAtIsNull();
}
