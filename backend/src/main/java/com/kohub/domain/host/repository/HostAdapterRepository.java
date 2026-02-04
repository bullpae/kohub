package com.kohub.domain.host.repository;

import com.kohub.domain.host.entity.HostAdapter;
import com.kohub.domain.host.entity.HostAdapterStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 호스트 어댑터 Repository
 */
@Repository
public interface HostAdapterRepository extends JpaRepository<HostAdapter, UUID> {

    /**
     * 호스트별 어댑터 목록
     */
    List<HostAdapter> findByHostId(UUID hostId);

    /**
     * 호스트 + 어댑터 타입으로 조회
     */
    Optional<HostAdapter> findByHostIdAndAdapterType(UUID hostId, String adapterType);

    /**
     * 어댑터 타입 + 외부 ID로 조회 (Webhook 매핑용)
     */
    Optional<HostAdapter> findByAdapterTypeAndExternalId(String adapterType, String externalId);

    /**
     * 어댑터 타입별 목록
     */
    List<HostAdapter> findByAdapterType(String adapterType);

    /**
     * 활성화된 어댑터 목록
     */
    List<HostAdapter> findByAdapterTypeAndStatus(String adapterType, HostAdapterStatus status);

    /**
     * 호스트에 특정 어댑터가 있는지 확인
     */
    boolean existsByHostIdAndAdapterType(UUID hostId, String adapterType);

    /**
     * 호스트별 활성 어댑터 목록 (Fetch Join)
     */
    @Query("SELECT ha FROM HostAdapter ha JOIN FETCH ha.host WHERE ha.host.id = :hostId AND ha.status = 'ACTIVE'")
    List<HostAdapter> findActiveByHostId(@Param("hostId") UUID hostId);

    /**
     * 외부 ID로 호스트 ID 조회 (Webhook에서 사용)
     */
    @Query("SELECT ha.host.id FROM HostAdapter ha WHERE ha.adapterType = :adapterType AND ha.externalId = :externalId")
    Optional<UUID> findHostIdByAdapterTypeAndExternalId(
            @Param("adapterType") String adapterType, 
            @Param("externalId") String externalId);
}
