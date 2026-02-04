-- V2: 알림 시스템 테이블

-- 알림 테이블
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    title VARCHAR(255) NOT NULL,
    content TEXT,
    entity_type VARCHAR(30),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    retry_count INT DEFAULT 0,
    error_message VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMP,
    read_at TIMESTAMP
);

-- 알림 설정 테이블
CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(30) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    UNIQUE (user_id, notification_type, channel)
);

-- 인덱스
CREATE INDEX idx_notifications_recipient_status ON notifications(recipient_id, status);
CREATE INDEX idx_notifications_status_channel ON notifications(status, channel);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notification_settings_user ON notification_settings(user_id);

COMMENT ON TABLE notifications IS '알림';
COMMENT ON TABLE notification_settings IS '사용자별 알림 설정';
