package com.kohub.domain.user.repository;

import com.kohub.domain.user.entity.User;
import com.kohub.domain.user.entity.UserRole;
import com.kohub.domain.user.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 사용자 Repository
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    /**
     * Keycloak ID로 조회
     */
    Optional<User> findByKeycloakId(String keycloakId);

    /**
     * Keycloak ID 존재 여부
     */
    boolean existsByKeycloakId(String keycloakId);

    /**
     * 이메일로 조회
     */
    Optional<User> findByEmail(String email);

    /**
     * 조직별 사용자 목록
     */
    Page<User> findByOrganizationId(UUID organizationId, Pageable pageable);

    /**
     * 역할별 사용자 목록
     */
    List<User> findByRole(UserRole role);

    /**
     * 조직 + 역할로 조회
     */
    List<User> findByOrganizationIdAndRole(UUID organizationId, UserRole role);

    /**
     * 운영자 목록 (ADMIN, OPERATOR)
     */
    @Query("SELECT u FROM User u WHERE u.role IN ('ADMIN', 'OPERATOR') AND u.status = 'ACTIVE'")
    List<User> findOperators();

    /**
     * 필터 + 검색
     */
    @Query("SELECT u FROM User u WHERE " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:organizationId IS NULL OR u.organizationId = :organizationId) AND " +
           "(:keyword IS NULL OR LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findByFilters(
            @Param("status") UserStatus status,
            @Param("role") UserRole role,
            @Param("organizationId") UUID organizationId,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * 상태별 사용자 수
     */
    long countByStatus(UserStatus status);
}
