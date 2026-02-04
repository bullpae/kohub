package com.kohub.domain.host.repository;

import com.kohub.domain.host.entity.Host;
import com.kohub.domain.host.entity.HostStatus;
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
 * 호스트 Repository
 */
@Repository
public interface HostRepository extends JpaRepository<Host, UUID> {

    /**
     * 이름으로 호스트 조회
     */
    Optional<Host> findByName(String name);

    /**
     * 이름 중복 확인
     */
    boolean existsByName(String name);

    /**
     * 상태별 호스트 목록 조회
     */
    List<Host> findByStatus(HostStatus status);

    /**
     * 조직별 호스트 목록 조회
     */
    Page<Host> findByOrganizationId(UUID organizationId, Pageable pageable);

    /**
     * 상태별 호스트 수 조회
     */
    long countByStatus(HostStatus status);

    /**
     * 전체 통계 조회 (단일 쿼리)
     */
    @Query("SELECT new map(" +
           "COUNT(h) as total, " +
           "SUM(CASE WHEN h.status = 'ACTIVE' THEN 1 ELSE 0 END) as active, " +
           "SUM(CASE WHEN h.status = 'INACTIVE' THEN 1 ELSE 0 END) as inactive, " +
           "SUM(CASE WHEN h.status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance) " +
           "FROM Host h")
    java.util.Map<String, Long> getStats();

    /**
     * 검색 (이름, 설명, 태그)
     */
    @Query("SELECT h FROM Host h WHERE " +
           "LOWER(h.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Host> search(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 상태 필터 + 검색
     */
    @Query("SELECT h FROM Host h WHERE " +
           "(:status IS NULL OR h.status = :status) AND " +
           "(:keyword IS NULL OR LOWER(h.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(h.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Host> findByStatusAndKeyword(
            @Param("status") HostStatus status,
            @Param("keyword") String keyword,
            Pageable pageable);
}
