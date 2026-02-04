package com.kohub.domain.ai.service;

import com.kohub.domain.ai.dto.SimilarTicketResponse;
import com.kohub.domain.ticket.entity.Ticket;
import com.kohub.domain.ticket.entity.TicketStatus;
import com.kohub.domain.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 유사 티켓 검색 서비스
 * - 키워드 기반 유사도 계산
 * - 향후 Vector DB 연동 예정
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SimilarTicketService {

    private final TicketRepository ticketRepository;

    // 불용어 (검색에서 제외할 단어)
    private static final Set<String> STOP_WORDS = Set.of(
            "은", "는", "이", "가", "을", "를", "의", "에", "에서", "으로", "로",
            "a", "an", "the", "is", "are", "was", "were", "be", "been",
            "and", "or", "not", "for", "to", "of", "in", "on", "at"
    );

    /**
     * 유사 티켓 검색
     * @param ticketId 기준 티켓 ID
     * @param limit 최대 결과 수
     * @return 유사 티켓 목록 (유사도 순)
     */
    public List<SimilarTicketResponse> findSimilarTickets(UUID ticketId, int limit) {
        Ticket sourceTicket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("티켓을 찾을 수 없습니다"));

        return findSimilarTickets(sourceTicket.getTitle(), sourceTicket.getDescription(), ticketId, limit);
    }

    /**
     * 텍스트 기반 유사 티켓 검색
     */
    public List<SimilarTicketResponse> findSimilarTickets(String title, String description, UUID excludeId, int limit) {
        // 소스 키워드 추출
        Set<String> sourceKeywords = extractKeywords(title + " " + (description != null ? description : ""));
        
        if (sourceKeywords.isEmpty()) {
            return List.of();
        }

        // 해결된 티켓에서 검색 (참고 가능한 해결책이 있는 티켓)
        List<Ticket> completedTickets = ticketRepository.findAll().stream()
                .filter(t -> t.getStatus() == TicketStatus.COMPLETED || t.getStatus() == TicketStatus.CLOSED)
                .filter(t -> t.getResolutionSummary() != null && !t.getResolutionSummary().isBlank())
                .filter(t -> excludeId == null || !t.getId().equals(excludeId))
                .toList();

        // 유사도 계산
        List<TicketSimilarity> similarities = completedTickets.stream()
                .map(ticket -> {
                    Set<String> ticketKeywords = extractKeywords(
                            ticket.getTitle() + " " + (ticket.getDescription() != null ? ticket.getDescription() : ""));
                    double similarity = calculateJaccardSimilarity(sourceKeywords, ticketKeywords);
                    Set<String> matchedWords = new HashSet<>(sourceKeywords);
                    matchedWords.retainAll(ticketKeywords);
                    return new TicketSimilarity(ticket, similarity, matchedWords);
                })
                .filter(ts -> ts.similarity > 0.1) // 최소 유사도
                .sorted(Comparator.comparingDouble((TicketSimilarity ts) -> ts.similarity).reversed())
                .limit(limit)
                .toList();

        return similarities.stream()
                .map(ts -> SimilarTicketResponse.from(ts.ticket, ts.similarity, 
                        String.join(", ", ts.matchedKeywords)))
                .toList();
    }

    /**
     * 키워드 기반 티켓 추천
     */
    public List<SimilarTicketResponse> recommendByKeywords(String keywords, int limit) {
        return findSimilarTickets(keywords, null, null, limit);
    }

    /**
     * 텍스트에서 키워드 추출
     */
    private Set<String> extractKeywords(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(text.toLowerCase()
                        .replaceAll("[^a-zA-Z0-9가-힣\\s]", " ")
                        .split("\\s+"))
                .filter(word -> word.length() >= 2)
                .filter(word -> !STOP_WORDS.contains(word))
                .collect(Collectors.toSet());
    }

    /**
     * Jaccard 유사도 계산
     */
    private double calculateJaccardSimilarity(Set<String> set1, Set<String> set2) {
        if (set1.isEmpty() || set2.isEmpty()) {
            return 0.0;
        }

        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);

        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);

        return (double) intersection.size() / union.size();
    }

    /**
     * 내부 클래스: 티켓 유사도
     */
    private record TicketSimilarity(Ticket ticket, double similarity, Set<String> matchedKeywords) {}
}
