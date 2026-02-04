package com.kohub.domain.notification.controller;

import com.kohub.common.response.ApiResponse;
import com.kohub.common.security.AuthenticatedUser;
import com.kohub.common.security.CurrentUser;
import com.kohub.domain.notification.dto.NotificationResponse;
import com.kohub.domain.notification.entity.NotificationChannel;
import com.kohub.domain.notification.entity.NotificationSetting;
import com.kohub.domain.notification.entity.NotificationType;
import com.kohub.domain.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 알림 API
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification", description = "알림 관리 API")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 내 알림 목록
     */
    @GetMapping
    @Operation(summary = "알림 목록", description = "로그인한 사용자의 알림 목록을 조회합니다")
    public ApiResponse<Page<NotificationResponse>> getNotifications(
            @CurrentUser AuthenticatedUser user,
            @PageableDefault(size = 20) Pageable pageable) {
        
        if (user == null) {
            return ApiResponse.success(Page.empty());
        }
        return ApiResponse.success(notificationService.getNotifications(user.getUserId(), pageable));
    }

    /**
     * 읽지 않은 알림 개수
     */
    @GetMapping("/unread-count")
    @Operation(summary = "읽지 않은 알림 개수")
    public ApiResponse<UnreadCountResponse> getUnreadCount(@CurrentUser AuthenticatedUser user) {
        if (user == null) {
            return ApiResponse.success(new UnreadCountResponse(0));
        }
        long count = notificationService.getUnreadCount(user.getUserId());
        return ApiResponse.success(new UnreadCountResponse(count));
    }

    /**
     * 알림 읽음 처리
     */
    @PostMapping("/{id}/read")
    @Operation(summary = "알림 읽음 처리")
    public ApiResponse<Void> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ApiResponse.success(null);
    }

    /**
     * 모든 알림 읽음 처리
     */
    @PostMapping("/read-all")
    @Operation(summary = "모든 알림 읽음 처리")
    public ApiResponse<Void> markAllAsRead(@CurrentUser AuthenticatedUser user) {
        if (user != null) {
            notificationService.markAllAsRead(user.getUserId());
        }
        return ApiResponse.success(null);
    }

    /**
     * 알림 설정 조회
     */
    @GetMapping("/settings")
    @Operation(summary = "알림 설정 조회")
    public ApiResponse<List<NotificationSetting>> getSettings(@CurrentUser AuthenticatedUser user) {
        if (user == null) {
            return ApiResponse.success(List.of());
        }
        return ApiResponse.success(notificationService.getSettings(user.getUserId()));
    }

    /**
     * 알림 설정 업데이트
     */
    @PutMapping("/settings")
    @Operation(summary = "알림 설정 업데이트")
    public ApiResponse<Void> updateSetting(
            @CurrentUser AuthenticatedUser user,
            @RequestBody SettingUpdateRequest request) {
        
        if (user != null) {
            notificationService.updateSetting(
                    user.getUserId(),
                    request.type(),
                    request.channel(),
                    request.enabled());
        }
        return ApiResponse.success(null);
    }

    public record UnreadCountResponse(long count) {}

    public record SettingUpdateRequest(
            NotificationType type,
            NotificationChannel channel,
            boolean enabled) {}
}
