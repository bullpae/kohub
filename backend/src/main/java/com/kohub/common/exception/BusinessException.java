package com.kohub.common.exception;

import lombok.Getter;

/**
 * 비즈니스 로직 예외
 */
@Getter
public class BusinessException extends RuntimeException {
    
    private final ErrorCode errorCode;
    private final Object details;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = null;
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.details = null;
    }

    public BusinessException(ErrorCode errorCode, Object details) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.details = details;
    }
}
