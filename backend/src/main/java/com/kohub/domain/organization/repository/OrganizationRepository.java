package com.kohub.domain.organization.repository;

import com.kohub.domain.organization.entity.Organization;
import com.kohub.domain.organization.entity.OrganizationStatus;
import com.kohub.domain.organization.entity.OrganizationType;
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
 * 조직 Repository
 */
@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    /**
     * 코드로 조회
     */
    Optional<Organization> findByCode(String code);

    /**
     * 코드 존재 여부
     */
    boolean existsByCode(String code);

    /**
     * 이름으로 조회
     */
    Optional<Organization> findByName(String name);

    /**
     * 유형별 조직 목록
     */
    List<Organization> findByType(OrganizationType type);

    /**
     * 상태별 조직 목록
     */
    List<Organization> findByStatus(OrganizationStatus status);

    /**
     * 활성 고객사 목록
     */
    @Query("SELECT o FROM Organization o WHERE o.type = 'CUSTOMER' AND o.status = 'ACTIVE'")
    List<Organization> findActiveCustomers();

    /**
     * 하위 조직 목록
     */
    List<Organization> findByParentId(UUID parentId);

    /**
     * 담당자별 조직 목록
     */
    List<Organization> findByManagerId(UUID managerId);

    /**
     * 필터 + 검색
     */
    @Query("SELECT o FROM Organization o WHERE " +
           "(:status IS NULL OR o.status = :status) AND " +
           "(:type IS NULL OR o.type = :type) AND " +
           "(:keyword IS NULL OR LOWER(o.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(o.code) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Organization> findByFilters(
            @Param("status") OrganizationStatus status,
            @Param("type") OrganizationType type,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * 상태별 조직 수
     */
    long countByStatus(OrganizationStatus status);

    /**
     * 유형별 조직 수
     */
    long countByType(OrganizationType type);
}
