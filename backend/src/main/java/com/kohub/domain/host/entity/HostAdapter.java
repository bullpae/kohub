package com.kohub.domain.host.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 호스트-어댑터 연결 엔티티
 * 호스트와 외부 도구(Uptime Kuma, Termix 등)의 매핑 정보를 관리
 */
@Entity
@Table(name = "host_adapters", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"host_id", "adapter_type"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class HostAdapter {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 연결된 호스트
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private Host host;

    /**
     * 어댑터 유형 (uptime-kuma, termix, prometheus 등)
     */
    @Column(name = "adapter_type", nullable = false, length = 30)
    private String adapterType;

    /**
     * 외부 시스템의 ID (예: Uptime Kuma의 monitor ID)
     */
    @Column(name = "external_id", length = 100)
    private String externalId;

    /**
     * 어댑터별 추가 설정 (JSONB)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> config = new HashMap<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private HostAdapterStatus status = HostAdapterStatus.ACTIVE;

    /**
     * 마지막 동기화 시간
     */
    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    /**
     * 오류 메시지 (상태가 ERROR일 때)
     */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // === Business Methods ===

    /**
     * 외부 ID 설정 (연동 완료 시)
     */
    public void linkExternal(String externalId) {
        this.externalId = externalId;
        this.status = HostAdapterStatus.ACTIVE;
        this.lastSyncAt = LocalDateTime.now();
        this.errorMessage = null;
    }

    /**
     * 설정 업데이트
     */
    public void updateConfig(Map<String, Object> config) {
        if (config != null) {
            this.config = new HashMap<>(config);
        }
    }

    /**
     * 동기화 성공
     */
    public void syncSuccess() {
        this.status = HostAdapterStatus.ACTIVE;
        this.lastSyncAt = LocalDateTime.now();
        this.errorMessage = null;
    }

    /**
     * 동기화 실패
     */
    public void syncFailed(String errorMessage) {
        this.status = HostAdapterStatus.ERROR;
        this.errorMessage = errorMessage;
    }

    /**
     * 비활성화
     */
    public void deactivate() {
        this.status = HostAdapterStatus.INACTIVE;
    }

    /**
     * 활성화
     */
    public void activate() {
        this.status = HostAdapterStatus.ACTIVE;
        this.errorMessage = null;
    }

    /**
     * 특정 설정값 조회
     */
    @SuppressWarnings("unchecked")
    public <T> T getConfigValue(String key, T defaultValue) {
        Object value = config.get(key);
        return value != null ? (T) value : defaultValue;
    }
}
