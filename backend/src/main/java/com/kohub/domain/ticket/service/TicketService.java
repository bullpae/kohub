package com.kohub.domain.ticket.service;

import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.domain.ticket.dto.TicketDetailResponse;
import com.kohub.domain.ticket.dto.TicketRequest;
import com.kohub.domain.ticket.dto.TicketResponse;
import com.kohub.domain.ticket.entity.Ticket;
import com.kohub.domain.ticket.entity.TicketPriority;
import com.kohub.domain.ticket.entity.TicketStatus;
import com.kohub.domain.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 티켓 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class TicketService {

    private final TicketRepository ticketRepository;

    /**
     * 티켓 생성
     */
    @Transactional
    public TicketResponse create(TicketRequest request, UUID reporterId) {
        // 소스 이벤트 ID 중복 체크 (어댑터에서 생성된 경우)
        if (request.getSourceEventId() != null && 
            ticketRepository.existsBySourceEventId(request.getSourceEventId())) {
            log.warn("중복 이벤트 무시: sourceEventId={}", request.getSourceEventId());
            return ticketRepository.findBySourceEventId(request.getSourceEventId())
                    .map(TicketResponse::from)
                    .orElseThrow(() -> new BusinessException(ErrorCode.TICKET_NOT_FOUND));
        }

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .source(request.getSource())
                .sourceEventId(request.getSourceEventId())
                .priority(request.getPriority())
                .hostId(request.getHostId())
                .reporterId(reporterId)
                .organizationId(request.getOrganizationId())
                .status(TicketStatus.NEW)
                .build();

        Ticket saved = ticketRepository.save(ticket);
        log.info("티켓 생성 완료: id={}, title={}", saved.getId(), saved.getTitle());

        return TicketResponse.from(saved);
    }

    /**
     * 티켓 상세 조회
     */
    public TicketDetailResponse getById(UUID id) {
        Ticket ticket = findTicketById(id);
        return TicketDetailResponse.from(ticket);
    }

    /**
     * 티켓 목록 조회
     */
    public Page<TicketResponse> getList(TicketStatus status, TicketPriority priority,
                                        UUID assigneeId, String keyword, Pageable pageable) {
        Page<Ticket> tickets = ticketRepository.findByFilters(status, priority, assigneeId, keyword, pageable);
        return tickets.map(TicketResponse::from);
    }

    /**
     * 미완료 티켓 목록
     */
    public Page<TicketResponse> getOpenTickets(Pageable pageable) {
        Page<Ticket> tickets = ticketRepository.findOpenTickets(pageable);
        return tickets.map(TicketResponse::from);
    }

    /**
     * 티켓 수정
     */
    @Transactional
    public TicketResponse update(UUID id, TicketRequest request) {
        Ticket ticket = findTicketById(id);

        ticket.update(
                request.getTitle(),
                request.getDescription(),
                request.getPriority()
        );

        log.info("티켓 수정 완료: id={}", id);
        return TicketResponse.from(ticket);
    }

    /**
     * 티켓 접수
     */
    @Transactional
    public TicketResponse receive(UUID id, UUID actorId) {
        Ticket ticket = findTicketById(id);
        ticket.receive(actorId);
        log.info("티켓 접수 완료: id={}", id);
        return TicketResponse.from(ticket);
    }

    /**
     * 담당자 배정
     */
    @Transactional
    public TicketResponse assign(UUID id, UUID assigneeId, UUID actorId) {
        Ticket ticket = findTicketById(id);
        ticket.assign(assigneeId, actorId);
        log.info("담당자 배정 완료: ticketId={}, assigneeId={}", id, assigneeId);
        return TicketResponse.from(ticket);
    }

    /**
     * 상태 전이
     */
    @Transactional
    public TicketResponse transition(UUID id, TicketStatus newStatus, String reason, UUID actorId) {
        Ticket ticket = findTicketById(id);
        ticket.transitionTo(newStatus, reason, actorId);
        log.info("상태 전이 완료: id={}, status={}", id, newStatus);
        return TicketResponse.from(ticket);
    }

    /**
     * 해결 처리
     */
    @Transactional
    public TicketResponse resolve(UUID id, String resolutionSummary, UUID actorId) {
        Ticket ticket = findTicketById(id);
        ticket.resolve(resolutionSummary, actorId);
        log.info("티켓 해결 완료: id={}", id);
        return TicketResponse.from(ticket);
    }

    /**
     * 코멘트 추가
     */
    @Transactional
    public TicketDetailResponse addComment(UUID id, String content, UUID actorId) {
        Ticket ticket = findTicketById(id);
        ticket.addComment(content, actorId);
        log.info("코멘트 추가: ticketId={}", id);
        return TicketDetailResponse.from(ticket);
    }

    /**
     * 티켓 통계
     */
    public TicketStats getStats() {
        long total = ticketRepository.count();
        long newCount = ticketRepository.countByStatus(TicketStatus.NEW);
        long inProgress = ticketRepository.countByStatus(TicketStatus.IN_PROGRESS);
        long resolved = ticketRepository.countByStatus(TicketStatus.RESOLVED);
        long critical = ticketRepository.countByPriority(TicketPriority.CRITICAL);
        long high = ticketRepository.countByPriority(TicketPriority.HIGH);

        return new TicketStats(total, newCount, inProgress, resolved, critical, high);
    }

    private Ticket findTicketById(UUID id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.TICKET_NOT_FOUND));
    }

    /**
     * 티켓 통계 DTO
     */
    public record TicketStats(
            long total, 
            long newCount, 
            long inProgress, 
            long resolved, 
            long critical, 
            long high
    ) {}
}
