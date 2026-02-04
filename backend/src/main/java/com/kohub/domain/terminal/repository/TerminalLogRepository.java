package com.kohub.domain.terminal.repository;

import com.kohub.domain.terminal.entity.TerminalLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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

    /**
     * 명령어 내용 검색
     */
    @Query("SELECT t FROM TerminalLog t WHERE t.commandLog LIKE %:keyword% ORDER BY t.startedAt DESC")
    Page<TerminalLog> searchByCommandLog(String keyword, Pageable pageable);

    /**
     * 기간별 세션 목록
     */
    @Query("SELECT t FROM TerminalLog t WHERE t.startedAt BETWEEN :start AND :end ORDER BY t.startedAt DESC")
    Page<TerminalLog> findByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * 호스트별 최근 세션
     */
    @Query("SELECT t FROM TerminalLog t WHERE t.hostId = :hostId ORDER BY t.startedAt DESC")
    List<TerminalLog> findRecentByHostId(UUID hostId, Pageable pageable);

    /**
     * 세션 통계 (호스트별 세션 수)
     */
    @Query("SELECT t.hostId, COUNT(t), SUM(t.commandCount) FROM TerminalLog t " +
           "WHERE t.startedAt >= :since GROUP BY t.hostId ORDER BY COUNT(t) DESC")
    List<Object[]> getSessionStatsByHost(LocalDateTime since);

    /**
     * 사용자별 세션 통계
     */
    @Query("SELECT t.userId, COUNT(t), SUM(t.commandCount) FROM TerminalLog t " +
           "WHERE t.userId IS NOT NULL AND t.startedAt >= :since GROUP BY t.userId ORDER BY COUNT(t) DESC")
    List<Object[]> getSessionStatsByUser(LocalDateTime since);
}
