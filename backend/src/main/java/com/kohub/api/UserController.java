package com.kohub.api;

import com.kohub.common.response.ApiResponse;
import com.kohub.common.security.AuthenticatedUser;
import com.kohub.common.security.CurrentUser;
import com.kohub.domain.user.dto.UserResponse;
import com.kohub.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 사용자 API
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User", description = "사용자 관리 API")
public class UserController {

    private final UserService userService;

    /**
     * 현재 로그인한 사용자 정보
     */
    @GetMapping("/me")
    @Operation(summary = "내 정보", description = "현재 로그인한 사용자 정보를 조회합니다")
    public ApiResponse<MeResponse> getMe(@CurrentUser AuthenticatedUser user) {
        if (user == null) {
            return ApiResponse.success(null);
        }
        
        return ApiResponse.success(new MeResponse(
                user.getUserId().toString(),
                user.getKeycloakId(),
                user.getEmail(),
                user.getName(),
                user.getRoles(),
                user.isAdmin(),
                user.isOperator()
        ));
    }

    /**
     * 운영자 목록 (담당자 배정용)
     */
    @GetMapping("/operators")
    @Operation(summary = "운영자 목록", description = "담당자 배정을 위한 운영자 목록을 조회합니다")
    public ApiResponse<List<UserResponse.Summary>> getOperators() {
        return ApiResponse.success(userService.getOperators());
    }

    /**
     * 내 정보 응답
     */
    public record MeResponse(
            String id,
            String keycloakId,
            String email,
            String name,
            java.util.Set<String> roles,
            boolean admin,
            boolean operator
    ) {}
}
