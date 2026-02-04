package com.kohub.domain.ticket.controller;

import com.kohub.common.response.ApiResponse;
import com.kohub.common.response.PageResponse;
import com.kohub.domain.ticket.dto.TicketDetailResponse;
import com.kohub.domain.ticket.dto.TicketRequest;
import com.kohub.domain.ticket.dto.TicketResponse;
import com.kohub.domain.ticket.entity.TicketPriority;
import com.kohub.domain.ticket.entity.TicketStatus;
import com.kohub.domain.ticket.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 티켓 관리 API
 */
@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
@Tag(name = "Ticket", description = "티켓(장애/요청) 관리 API")
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @Operation(summary = "티켓 생성", description = "새 티켓을 생성합니다")
    public ResponseEntity<ApiResponse<TicketResponse>> create(
            @Valid @RequestBody TicketRequest request) {
        // TODO: 실제 사용자 ID는 Security Context에서 가져오기
        UUID reporterId = null;
        TicketResponse response = ticketService.create(request, reporterId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "티켓 상세 조회", description = "티켓 상세 정보와 활동 기록을 조회합니다")
    public ResponseEntity<ApiResponse<TicketDetailResponse>> getById(@PathVariable UUID id) {
        TicketDetailResponse response = ticketService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "티켓 목록 조회", description = "티켓 목록을 페이징하여 조회합니다")
    public ResponseEntity<ApiResponse<PageResponse<TicketResponse>>> getList(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) UUID assigneeId,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TicketResponse> page = ticketService.getList(status, priority, assigneeId, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/open")
    @Operation(summary = "미완료 티켓 목록", description = "처리 중인 티켓 목록을 조회합니다")
    public ResponseEntity<ApiResponse<PageResponse<TicketResponse>>> getOpenTickets(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<TicketResponse> page = ticketService.getOpenTickets(pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "티켓 수정", description = "티켓 정보를 수정합니다")
    public ResponseEntity<ApiResponse<TicketResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody TicketRequest request) {
        TicketResponse response = ticketService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/receive")
    @Operation(summary = "티켓 접수", description = "티켓을 접수 처리합니다")
    public ResponseEntity<ApiResponse<TicketResponse>> receive(@PathVariable UUID id) {
        // TODO: 실제 사용자 ID는 Security Context에서 가져오기
        UUID actorId = null;
        TicketResponse response = ticketService.receive(id, actorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/assign")
    @Operation(summary = "담당자 배정", description = "티켓에 담당자를 배정합니다")
    public ResponseEntity<ApiResponse<TicketResponse>> assign(
            @PathVariable UUID id,
            @RequestParam UUID assigneeId) {
        // TODO: 실제 사용자 ID는 Security Context에서 가져오기
        UUID actorId = null;
        TicketResponse response = ticketService.assign(id, assigneeId, actorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/transition")
    @Operation(summary = "상태 전이", description = "티켓 상태를 변경합니다")
    public ResponseEntity<ApiResponse<TicketResponse>> transition(
            @PathVariable UUID id,
            @RequestParam TicketStatus status,
            @RequestParam(required = false) String reason) {
        // TODO: 실제 사용자 ID는 Security Context에서 가져오기
        UUID actorId = null;
        TicketResponse response = ticketService.transition(id, status, reason, actorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/resolve")
    @Operation(summary = "해결 처리", description = "티켓을 해결 처리합니다")
    public ResponseEntity<ApiResponse<TicketResponse>> resolve(
            @PathVariable UUID id,
            @RequestParam String summary) {
        // TODO: 실제 사용자 ID는 Security Context에서 가져오기
        UUID actorId = null;
        TicketResponse response = ticketService.resolve(id, summary, actorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "코멘트 추가", description = "티켓에 코멘트를 추가합니다")
    public ResponseEntity<ApiResponse<TicketDetailResponse>> addComment(
            @PathVariable UUID id,
            @RequestParam String content) {
        // TODO: 실제 사용자 ID는 Security Context에서 가져오기
        UUID actorId = null;
        TicketDetailResponse response = ticketService.addComment(id, content, actorId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/stats")
    @Operation(summary = "티켓 통계", description = "티켓 상태별/우선순위별 통계를 조회합니다")
    public ResponseEntity<ApiResponse<TicketService.TicketStats>> getStats() {
        TicketService.TicketStats stats = ticketService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
