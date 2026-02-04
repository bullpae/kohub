package com.kohub.adapter;

import com.kohub.domain.ticket.dto.TicketRequest;

import java.util.Map;
import java.util.Optional;

/**
 * 외부 도구 어댑터 인터페이스
 */
public interface ToolAdapter {
    
    /**
     * 어댑터 이름
     */
    String getName();
    
    /**
     * 어댑터 타입
     */
    AdapterType getType();
    
    /**
     * 지원하는 기능들
     */
    AdapterCapability[] getCapabilities();
    
    /**
     * Webhook 처리 - 티켓 생성 요청으로 변환
     * @param payload Webhook 페이로드
     * @param headers HTTP 헤더
     * @return 티켓 생성 요청 (해당되지 않으면 empty)
     */
    Optional<TicketRequest> handleWebhook(String payload, Map<String, String> headers);
    
    /**
     * 헬스 체크
     */
    boolean isHealthy();
}
