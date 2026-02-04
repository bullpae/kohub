package com.kohub.domain.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 조직 엔티티
 * MSP가 관리하는 고객사 또는 내부 조직
 */
@Entity
@Table(name = "organizations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    /**
     * 조직 코드 (고유)
     */
    @Column(unique = true, nullable = false, length = 20)
    private String code;

    @Column(length = 500)
    private String description;

    /**
     * 상위 조직 (계층 구조 지원)
     */
    @Column(name = "parent_id")
    private UUID parentId;

    /**
     * 조직 유형
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrganizationType type = OrganizationType.CUSTOMER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrganizationStatus status = OrganizationStatus.ACTIVE;

    /**
     * 담당 운영자 ID
     */
    @Column(name = "manager_id")
    private UUID managerId;

    /**
     * 연락처
     */
    @Column(length = 20)
    private String phone;

    /**
     * 대표 이메일
     */
    @Column(length = 100)
    private String email;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // === Business Methods ===

    /**
     * 조직 정보 수정
     */
    public void update(String name, String description, String phone, String email) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
        this.description = description;
        this.phone = phone;
        this.email = email;
    }

    /**
     * 담당자 변경
     */
    public void changeManager(UUID managerId) {
        this.managerId = managerId;
    }

    /**
     * 비활성화
     */
    public void deactivate() {
        this.status = OrganizationStatus.INACTIVE;
    }

    /**
     * 활성화
     */
    public void activate() {
        this.status = OrganizationStatus.ACTIVE;
    }
}
