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
 * Slack 알림 발송자
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SlackNotificationSender implements NotificationSender {

    @Value("${kohub.notification.slack.enabled:false}")
    private boolean enabled;

    @Value("${kohub.notification.slack.webhook-url:}")
    private String webhookUrl;

    @Value("${kohub.notification.slack.default-channel:#kohub-alerts}")
    private String defaultChannel;

    private final RestTemplate restTemplate;

    @Override
    public NotificationChannel getChannel() {
        return NotificationChannel.SLACK;
    }

    @Override
    public boolean send(Notification notification) {
        if (!isEnabled()) {
            log.debug("Slack 알림 비활성화됨");
            return false;
        }

        try {
            Map<String, Object> payload = buildSlackPayload(notification);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(webhookUrl, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Slack 알림 전송 성공: {}", notification.getId());
                return true;
            } else {
                log.warn("Slack 알림 전송 실패: status={}", response.getStatusCode());
                return false;
            }
        } catch (Exception e) {
            log.error("Slack 알림 전송 오류: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean isEnabled() {
        return enabled && webhookUrl != null && !webhookUrl.isBlank();
    }

    private Map<String, Object> buildSlackPayload(Notification notification) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("channel", defaultChannel);
        payload.put("username", "Kohub Bot");
        payload.put("icon_emoji", getEmojiForType(notification.getType().name()));

        // 블록 형식 메시지
        Map<String, Object> block = new HashMap<>();
        block.put("type", "section");
        
        Map<String, Object> text = new HashMap<>();
        text.put("type", "mrkdwn");
        text.put("text", String.format("*%s*\n%s", notification.getTitle(), notification.getContent()));
        block.put("text", text);

        payload.put("blocks", new Object[]{block});

        return payload;
    }

    private String getEmojiForType(String type) {
        return switch (type) {
            case "HOST_DOWN" -> ":red_circle:";
            case "HOST_UP" -> ":large_green_circle:";
            case "TICKET_CREATED" -> ":ticket:";
            case "TICKET_ASSIGNED" -> ":bust_in_silhouette:";
            case "TICKET_STATUS_CHANGED" -> ":arrows_counterclockwise:";
            default -> ":bell:";
        };
    }
}
