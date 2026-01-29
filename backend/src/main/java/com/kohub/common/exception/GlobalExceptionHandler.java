package com.kohub.common.exception;

import com.kohub.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * 전역 예외 처리 핸들러
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 비즈니스 예외 처리
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException e) {
        log.warn("비즈니스 예외 발생: {} - {}", e.getErrorCode().getCode(), e.getMessage());
        
        return ResponseEntity
                .status(e.getErrorCode().getHttpStatus())
                .body(ApiResponse.error(
                        e.getErrorCode().getCode(),
                        e.getMessage(),
                        e.getDetails()
                ));
    }

    /**
     * Validation 예외 처리
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException e) {
        Map<String, String> fieldErrors = e.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "유효하지 않은 값입니다",
                        (existing, replacement) -> existing
                ));

        log.warn("Validation 예외 발생: {}", fieldErrors);

        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(
                        ErrorCode.INVALID_REQUEST.getCode(),
                        "입력값 검증에 실패했습니다",
                        fieldErrors
                ));
    }

    /**
     * 기타 예외 처리
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        log.error("예상치 못한 예외 발생", e);
        
        return ResponseEntity
                .internalServerError()
                .body(ApiResponse.error(
                        ErrorCode.INTERNAL_ERROR.getCode(),
                        ErrorCode.INTERNAL_ERROR.getMessage()
                ));
    }
}
