package com.kohub.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 사용자 엔티티
 * Keycloak과 동기화되는 사용자 정보
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Keycloak 사용자 ID (sub claim)
     */
    @Column(name = "keycloak_id", unique = true, nullable = false, length = 100)
    private String keycloakId;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 50)
    private String name;

    /**
     * 표시 이름 (닉네임)
     */
    @Column(name = "display_name", length = 50)
    private String displayName;

    /**
     * 소속 조직
     */
    @Column(name = "organization_id")
    private UUID organizationId;

    /**
     * 사용자 역할 (Keycloak에서 동기화)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private UserRole role = UserRole.MEMBER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    /**
     * 마지막 로그인 시간
     */
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // === Business Methods ===

    /**
     * 로그인 시간 업데이트
     */
    public void updateLastLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    /**
     * 프로필 업데이트
     */
    public void updateProfile(String name, String displayName) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
        this.displayName = displayName;
    }

    /**
     * 역할 변경
     */
    public void changeRole(UserRole newRole) {
        this.role = newRole;
    }

    /**
     * 조직 변경
     */
    public void changeOrganization(UUID organizationId) {
        this.organizationId = organizationId;
    }

    /**
     * 비활성화
     */
    public void deactivate() {
        this.status = UserStatus.INACTIVE;
    }

    /**
     * 활성화
     */
    public void activate() {
        this.status = UserStatus.ACTIVE;
    }

    /**
     * Keycloak 정보로 동기화
     */
    public void syncFromKeycloak(String email, String name, UserRole role) {
        this.email = email;
        this.name = name;
        this.role = role;
    }
}
