package com.kohub.domain.host.service;

import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.domain.host.dto.HostAdapterRequest;
import com.kohub.domain.host.dto.HostAdapterResponse;
import com.kohub.domain.host.entity.Host;
import com.kohub.domain.host.entity.HostAdapter;
import com.kohub.domain.host.entity.HostAdapterStatus;
import com.kohub.domain.host.repository.HostAdapterRepository;
import com.kohub.domain.host.repository.HostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 호스트 어댑터 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class HostAdapterService {

    private final HostAdapterRepository hostAdapterRepository;
    private final HostRepository hostRepository;

    /**
     * 어댑터 연결 생성
     */
    @Transactional
    public HostAdapterResponse create(UUID hostId, HostAdapterRequest request) {
        Host host = hostRepository.findById(hostId)
                .orElseThrow(() -> new BusinessException(ErrorCode.HOST_NOT_FOUND));

        // 중복 체크
        if (hostAdapterRepository.existsByHostIdAndAdapterType(hostId, request.getAdapterType())) {
            throw new BusinessException(ErrorCode.ADAPTER_NOT_FOUND, 
                    "이미 연결된 어댑터입니다: " + request.getAdapterType());
        }

        HostAdapter adapter = HostAdapter.builder()
                .host(host)
                .adapterType(request.getAdapterType())
                .externalId(request.getExternalId())
                .config(request.getConfig())
                .status(HostAdapterStatus.ACTIVE)
                .build();

        HostAdapter saved = hostAdapterRepository.save(adapter);
        log.info("호스트 어댑터 연결: hostId={}, adapter={}", hostId, request.getAdapterType());

        return HostAdapterResponse.from(saved);
    }

    /**
     * 호스트별 어댑터 목록 조회
     */
    public List<HostAdapterResponse.Summary> getByHost(UUID hostId) {
        return hostAdapterRepository.findByHostId(hostId).stream()
                .map(HostAdapterResponse.Summary::from)
                .collect(Collectors.toList());
    }

    /**
     * 어댑터 상세 조회
     */
    public HostAdapterResponse getById(UUID id) {
        HostAdapter adapter = findById(id);
        return HostAdapterResponse.from(adapter);
    }

    /**
     * 외부 ID로 호스트 ID 조회 (Webhook 매핑용)
     */
    public Optional<UUID> findHostIdByExternalId(String adapterType, String externalId) {
        return hostAdapterRepository.findHostIdByAdapterTypeAndExternalId(adapterType, externalId);
    }

    /**
     * 외부 ID 연결 (Uptime Kuma Monitor ID 등)
     */
    @Transactional
    public HostAdapterResponse linkExternal(UUID hostId, String adapterType, String externalId) {
        HostAdapter adapter = hostAdapterRepository.findByHostIdAndAdapterType(hostId, adapterType)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADAPTER_NOT_FOUND));

        adapter.linkExternal(externalId);
        log.info("어댑터 외부 ID 연결: hostId={}, adapter={}, externalId={}", hostId, adapterType, externalId);

        return HostAdapterResponse.from(adapter);
    }

    /**
     * 설정 업데이트
     */
    @Transactional
    public HostAdapterResponse updateConfig(UUID id, HostAdapterRequest request) {
        HostAdapter adapter = findById(id);
        adapter.updateConfig(request.getConfig());
        
        if (request.getExternalId() != null) {
            adapter.linkExternal(request.getExternalId());
        }
        
        log.info("어댑터 설정 업데이트: id={}", id);
        return HostAdapterResponse.from(adapter);
    }

    /**
     * 동기화 상태 업데이트
     */
    @Transactional
    public void markSyncSuccess(UUID id) {
        HostAdapter adapter = findById(id);
        adapter.syncSuccess();
    }

    @Transactional
    public void markSyncFailed(UUID id, String errorMessage) {
        HostAdapter adapter = findById(id);
        adapter.syncFailed(errorMessage);
    }

    /**
     * 어댑터 비활성화
     */
    @Transactional
    public void deactivate(UUID id) {
        HostAdapter adapter = findById(id);
        adapter.deactivate();
        log.info("어댑터 비활성화: id={}", id);
    }

    /**
     * 어댑터 삭제
     */
    @Transactional
    public void delete(UUID id) {
        if (!hostAdapterRepository.existsById(id)) {
            throw new BusinessException(ErrorCode.ADAPTER_NOT_FOUND);
        }
        hostAdapterRepository.deleteById(id);
        log.info("어댑터 삭제: id={}", id);
    }

    private HostAdapter findById(UUID id) {
        return hostAdapterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ADAPTER_NOT_FOUND));
    }
}
