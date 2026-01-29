package com.kohub.api;

import com.kohub.common.response.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 헬스 체크 컨트롤러
 */
@RestController
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<Map<String, String>> health() {
        return ApiResponse.success(Map.of(
                "status", "UP",
                "service", "kohub-backend"
        ));
    }
}
