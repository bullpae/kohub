package com.kohub.common.config;

import com.kohub.domain.notification.entity.NotificationChannel;
import com.kohub.domain.notification.sender.NotificationSender;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 알림 설정
 */
@Configuration
@EnableAsync
public class NotificationConfig {

    /**
     * RestTemplate Bean
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    /**
     * 알림 발송자 Map
     */
    @Bean
    public Map<NotificationChannel, NotificationSender> notificationSenders(List<NotificationSender> senders) {
        return senders.stream()
                .collect(Collectors.toMap(
                        NotificationSender::getChannel,
                        Function.identity()
                ));
    }
}
