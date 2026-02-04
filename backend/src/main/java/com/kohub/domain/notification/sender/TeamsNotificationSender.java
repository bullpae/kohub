package com.kohub.domain.notification.sender;

import com.kohub.domain.notification.entity.Notification;
import com.kohub.domain.notification.entity.NotificationChannel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Microsoft Teams 알림 발송자
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TeamsNotificationSender implements NotificationSender {

    @Value("${kohub.notification.teams.enabled:false}")
    private boolean enabled;

    @Value("${kohub.notification.teams.webhook-url:}")
    private String webhookUrl;

    private final RestTemplate restTemplate;

    @Override
    public NotificationChannel getChannel() {
        return NotificationChannel.TEAMS;
    }

    @Override
    public boolean send(Notification notification) {
        if (!isEnabled()) {
            log.debug("Teams 알림 비활성화됨");
            return false;
        }

        try {
            Map<String, Object> payload = buildTeamsPayload(notification);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(webhookUrl, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Teams 알림 전송 성공: {}", notification.getId());
                return true;
            } else {
                log.warn("Teams 알림 전송 실패: status={}", response.getStatusCode());
                return false;
            }
        } catch (Exception e) {
            log.error("Teams 알림 전송 오류: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean isEnabled() {
        return enabled && webhookUrl != null && !webhookUrl.isBlank();
    }

    private Map<String, Object> buildTeamsPayload(Notification notification) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("@type", "MessageCard");
        payload.put("@context", "http://schema.org/extensions");
        payload.put("themeColor", getColorForType(notification.getType().name()));
        payload.put("summary", notification.getTitle());
        payload.put("title", notification.getTitle());
        payload.put("text", notification.getContent());

        return payload;
    }

    private String getColorForType(String type) {
        return switch (type) {
            case "HOST_DOWN" -> "FF0000";
            case "HOST_UP" -> "00FF00";
            case "TICKET_CREATED" -> "0078D7";
            case "TICKET_ASSIGNED" -> "FFA500";
            case "TICKET_PRIORITY_CHANGED" -> "FF6600";
            default -> "808080";
        };
    }
}
