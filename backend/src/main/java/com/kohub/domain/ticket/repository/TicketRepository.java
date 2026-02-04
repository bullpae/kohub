package com.kohub.domain.ticket.repository;

import com.kohub.domain.ticket.entity.Ticket;
import com.kohub.domain.ticket.entity.TicketPriority;
import com.kohub.domain.ticket.entity.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 티켓 Repository
 */
@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    /**
     * 소스 이벤트 ID로 조회 (중복 방지용)
     */
    Optional<Ticket> findBySourceEventId(String sourceEventId);

    /**
     * 소스 이벤트 ID 존재 여부
     */
    boolean existsBySourceEventId(String sourceEventId);

    /**
     * 담당자별 티켓 목록
     */
    Page<Ticket> findByAssigneeId(UUID assigneeId, Pageable pageable);

    /**
     * 상태별 티켓 목록
     */
    List<Ticket> findByStatus(TicketStatus status);

    /**
     * 상태별 티켓 수
     */
    long countByStatus(TicketStatus status);

    /**
     * 우선순위별 티켓 수
     */
    long countByPriority(TicketPriority priority);

    /**
     * 전체 통계 조회 (단일 쿼리)
     */
    @Query("SELECT new map(" +
           "COUNT(t) as total, " +
           "SUM(CASE WHEN t.status = com.kohub.domain.ticket.entity.TicketStatus.NEW THEN 1 ELSE 0 END) as newCount, " +
           "SUM(CASE WHEN t.status = com.kohub.domain.ticket.entity.TicketStatus.IN_PROGRESS THEN 1 ELSE 0 END) as inProgress, " +
           "SUM(CASE WHEN t.status = com.kohub.domain.ticket.entity.TicketStatus.PENDING THEN 1 ELSE 0 END) as pending, " +
           "SUM(CASE WHEN t.status = com.kohub.domain.ticket.entity.TicketStatus.RESOLVED THEN 1 ELSE 0 END) as resolved, " +
           "SUM(CASE WHEN t.status = com.kohub.domain.ticket.entity.TicketStatus.COMPLETED THEN 1 ELSE 0 END) as completed, " +
           "SUM(CASE WHEN t.status = com.kohub.domain.ticket.entity.TicketStatus.CLOSED THEN 1 ELSE 0 END) as closed, " +
           "SUM(CASE WHEN t.priority = com.kohub.domain.ticket.entity.TicketPriority.CRITICAL THEN 1 ELSE 0 END) as critical, " +
           "SUM(CASE WHEN t.priority = com.kohub.domain.ticket.entity.TicketPriority.HIGH THEN 1 ELSE 0 END) as high) " +
           "FROM Ticket t")
    java.util.Map<String, Long> getStats();

    /**
     * 호스트별 티켓 목록
     */
    Page<Ticket> findByHostId(UUID hostId, Pageable pageable);

    /**
     * 필터 + 검색
     */
    @Query("SELECT t FROM Ticket t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:assigneeId IS NULL OR t.assigneeId = :assigneeId) AND " +
           "(:keyword IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Ticket> findByFilters(
            @Param("status") TicketStatus status,
            @Param("priority") TicketPriority priority,
            @Param("assigneeId") UUID assigneeId,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * 미완료 티켓 (CLOSED 제외)
     */
    @Query("SELECT t FROM Ticket t WHERE t.status NOT IN (com.kohub.domain.ticket.entity.TicketStatus.CLOSED, com.kohub.domain.ticket.entity.TicketStatus.COMPLETED) ORDER BY " +
           "CASE t.priority " +
           "WHEN com.kohub.domain.ticket.entity.TicketPriority.CRITICAL THEN 1 " +
           "WHEN com.kohub.domain.ticket.entity.TicketPriority.HIGH THEN 2 " +
           "WHEN com.kohub.domain.ticket.entity.TicketPriority.MEDIUM THEN 3 ELSE 4 END, " +
           "t.createdAt DESC")
    Page<Ticket> findOpenTickets(Pageable pageable);
}
