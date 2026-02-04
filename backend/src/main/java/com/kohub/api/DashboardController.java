package com.kohub.api;

import com.kohub.common.response.ApiResponse;
import com.kohub.domain.host.dto.HostStatsResponse;
import com.kohub.domain.host.service.HostService;
import com.kohub.domain.ticket.dto.TicketResponse;
import com.kohub.domain.ticket.dto.TicketStatsResponse;
import com.kohub.domain.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 대시보드 통합 API
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final HostService hostService;
    private final TicketService ticketService;

    /**
     * 대시보드 요약 정보
     */
    @GetMapping("/summary")
    public ApiResponse<DashboardSummary> getSummary() {
        HostStatsResponse hostStats = hostService.getStats();
        TicketStatsResponse ticketStats = ticketService.getStats();
        
        var recentTickets = ticketService.getOpenTickets(PageRequest.of(0, 5))
                .getContent();

        return ApiResponse.success(new DashboardSummary(hostStats, ticketStats, recentTickets));
    }

    /**
     * 호스트 통계
     */
    @GetMapping("/hosts-status")
    public ApiResponse<HostStatsResponse> getHostStats() {
        return ApiResponse.success(hostService.getStats());
    }

    /**
     * 티켓 통계
     */
    @GetMapping("/tickets-status")
    public ApiResponse<TicketStatsResponse> getTicketStats() {
        return ApiResponse.success(ticketService.getStats());
    }

    /**
     * 최근 티켓
     */
    @GetMapping("/recent-tickets")
    public ApiResponse<List<TicketResponse>> getRecentTickets(
            @RequestParam(defaultValue = "10") int limit) {
        var tickets = ticketService.getOpenTickets(PageRequest.of(0, Math.min(limit, 50)))
                .getContent();
        return ApiResponse.success(tickets);
    }

    /**
     * 대시보드 요약 DTO
     */
    public record DashboardSummary(
            HostStatsResponse hosts,
            TicketStatsResponse tickets,
            List<TicketResponse> recentTickets
    ) {}
}
