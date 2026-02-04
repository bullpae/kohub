package com.kohub.domain.ai.controller;

import com.kohub.common.response.ApiResponse;
import com.kohub.domain.ai.dto.SimilarTicketResponse;
import com.kohub.domain.ai.service.SimilarTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * AI 추천 API
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI", description = "AI 추천 API")
public class AiController {

    private final SimilarTicketService similarTicketService;

    /**
     * 유사 티켓 검색
     */
    @GetMapping("/tickets/{ticketId}/similar")
    @Operation(summary = "유사 티켓 검색", description = "해당 티켓과 유사한 해결된 티켓을 검색합니다")
    public ApiResponse<List<SimilarTicketResponse>> findSimilarTickets(
            @PathVariable UUID ticketId,
            @RequestParam(defaultValue = "5") int limit) {
        
        List<SimilarTicketResponse> similar = similarTicketService.findSimilarTickets(ticketId, limit);
        return ApiResponse.success(similar);
    }

    /**
     * 키워드로 티켓 추천
     */
    @GetMapping("/tickets/recommend")
    @Operation(summary = "키워드 기반 티켓 추천", description = "키워드와 유사한 해결된 티켓을 추천합니다")
    public ApiResponse<List<SimilarTicketResponse>> recommendByKeywords(
            @RequestParam String keywords,
            @RequestParam(defaultValue = "5") int limit) {
        
        List<SimilarTicketResponse> recommendations = similarTicketService.recommendByKeywords(keywords, limit);
        return ApiResponse.success(recommendations);
    }

    /**
     * 텍스트로 유사 티켓 검색
     */
    @PostMapping("/tickets/search-similar")
    @Operation(summary = "텍스트 기반 유사 검색", description = "제목/설명 텍스트로 유사한 티켓을 검색합니다")
    public ApiResponse<List<SimilarTicketResponse>> searchSimilar(
            @RequestBody SearchRequest request) {
        
        List<SimilarTicketResponse> results = similarTicketService.findSimilarTickets(
                request.title(), request.description(), null, request.limit() > 0 ? request.limit() : 5);
        return ApiResponse.success(results);
    }

    public record SearchRequest(String title, String description, int limit) {}
}
