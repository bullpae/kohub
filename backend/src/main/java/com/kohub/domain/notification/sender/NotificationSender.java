package com.kohub.domain.notification.sender;

import com.kohub.domain.notification.entity.Notification;
import com.kohub.domain.notification.entity.NotificationChannel;

/**
 * 알림 발송 인터페이스
 */
public interface NotificationSender {

    /**
     * 지원 채널
     */
    NotificationChannel getChannel();

    /**
     * 알림 전송
     * @param notification 알림
     * @return 전송 성공 여부
     */
    boolean send(Notification notification);

    /**
     * 채널 활성화 여부
     */
    boolean isEnabled();
}
