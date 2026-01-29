package com.kohub.common.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/**
 * 에러 코드 정의
 */
@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    
    // 공통 에러 (1xxx)
    INTERNAL_ERROR("ERR_1000", "내부 서버 오류가 발생했습니다", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REQUEST("ERR_1001", "잘못된 요청입니다", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("ERR_1002", "인증이 필요합니다", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("ERR_1003", "접근 권한이 없습니다", HttpStatus.FORBIDDEN),
    NOT_FOUND("ERR_1004", "리소스를 찾을 수 없습니다", HttpStatus.NOT_FOUND),

    // Host 에러 (2xxx)
    HOST_NOT_FOUND("ERR_2001", "호스트를 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    HOST_ALREADY_EXISTS("ERR_2002", "이미 존재하는 호스트입니다", HttpStatus.CONFLICT),
    HOST_CONNECTION_FAILED("ERR_2003", "호스트 연결에 실패했습니다", HttpStatus.BAD_GATEWAY),

    // Ticket 에러 (3xxx)
    TICKET_NOT_FOUND("ERR_3001", "티켓을 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    TICKET_INVALID_STATUS_TRANSITION("ERR_3002", "유효하지 않은 상태 전이입니다", HttpStatus.BAD_REQUEST),
    TICKET_ALREADY_ASSIGNED("ERR_3003", "이미 담당자가 배정된 티켓입니다", HttpStatus.CONFLICT),

    // Organization 에러 (4xxx)
    ORGANIZATION_NOT_FOUND("ERR_4001", "조직을 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    ORGANIZATION_ALREADY_EXISTS("ERR_4002", "이미 존재하는 조직입니다", HttpStatus.CONFLICT),

    // User 에러 (5xxx)
    USER_NOT_FOUND("ERR_5001", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND),

    // Adapter 에러 (6xxx)
    ADAPTER_NOT_FOUND("ERR_6001", "어댑터를 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    ADAPTER_CONNECTION_FAILED("ERR_6002", "어댑터 연결에 실패했습니다", HttpStatus.BAD_GATEWAY),
    WEBHOOK_INVALID_SIGNATURE("ERR_6003", "Webhook 서명이 유효하지 않습니다", HttpStatus.UNAUTHORIZED);

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}
