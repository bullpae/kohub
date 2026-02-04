package com.kohub.domain.host.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 호스트(서버) 엔티티
 * MSP가 관리하는 인프라 자산을 나타낸다.
 */
@Entity
@Table(name = "hosts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Host {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "connection_type", nullable = false, length = 20)
    @Builder.Default
    private ConnectionType connectionType = ConnectionType.SSH;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "ssh_config", columnDefinition = "jsonb")
    private SshConfig sshConfig;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "host_tags", joinColumns = @JoinColumn(name = "host_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private HostStatus status = HostStatus.ACTIVE;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * 호스트 정보 수정
     */
    public void update(String name, String description, ConnectionType connectionType,
                       SshConfig sshConfig, List<String> tags) {
        this.name = name;
        this.description = description;
        this.connectionType = connectionType;
        this.sshConfig = sshConfig;
        this.tags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
    }

    /**
     * 호스트 상태 변경
     */
    public void changeStatus(HostStatus newStatus) {
        this.status = newStatus;
    }

    /**
     * 호스트 비활성화
     */
    public void deactivate() {
        this.status = HostStatus.INACTIVE;
    }

    /**
     * 호스트 활성화
     */
    public void activate() {
        this.status = HostStatus.ACTIVE;
    }
}
