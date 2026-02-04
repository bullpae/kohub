package com.kohub.domain.host.service;

import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.domain.host.dto.HostRequest;
import com.kohub.domain.host.dto.HostResponse;
import com.kohub.domain.host.entity.Host;
import com.kohub.domain.host.entity.HostStatus;
import com.kohub.domain.host.repository.HostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * 호스트 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class HostService {

    private final HostRepository hostRepository;

    /**
     * 호스트 생성
     */
    @Transactional
    public HostResponse create(HostRequest request) {
        // 이름 중복 검사
        if (hostRepository.existsByName(request.getName())) {
            throw new BusinessException(ErrorCode.HOST_ALREADY_EXISTS);
        }

        Host host = Host.builder()
                .name(request.getName())
                .description(request.getDescription())
                .connectionType(request.getConnectionType())
                .sshConfig(request.getSshConfig() != null ? request.getSshConfig().toEntity() : null)
                .tags(request.getTags())
                .organizationId(request.getOrganizationId())
                .status(HostStatus.ACTIVE)
                .build();

        Host saved = hostRepository.save(host);
        log.info("호스트 생성 완료: id={}, name={}", saved.getId(), saved.getName());

        return HostResponse.from(saved);
    }

    /**
     * 호스트 상세 조회
     */
    public HostResponse getById(UUID id) {
        Host host = findHostById(id);
        return HostResponse.from(host);
    }

    /**
     * 호스트 목록 조회 (페이징 + 필터)
     */
    public Page<HostResponse> getList(HostStatus status, String keyword, Pageable pageable) {
        Page<Host> hosts = hostRepository.findByStatusAndKeyword(status, keyword, pageable);
        return hosts.map(HostResponse::from);
    }

    /**
     * 호스트 수정
     */
    @Transactional
    public HostResponse update(UUID id, HostRequest request) {
        Host host = findHostById(id);

        // 이름 변경 시 중복 검사
        if (!host.getName().equals(request.getName()) && 
            hostRepository.existsByName(request.getName())) {
            throw new BusinessException(ErrorCode.HOST_ALREADY_EXISTS);
        }

        host.update(
                request.getName(),
                request.getDescription(),
                request.getConnectionType(),
                request.getSshConfig() != null ? request.getSshConfig().toEntity() : null,
                request.getTags()
        );

        log.info("호스트 수정 완료: id={}", id);
        return HostResponse.from(host);
    }

    /**
     * 호스트 삭제 (비활성화)
     */
    @Transactional
    public void delete(UUID id) {
        Host host = findHostById(id);
        host.deactivate();
        log.info("호스트 비활성화 완료: id={}", id);
    }

    /**
     * 호스트 상태 변경
     */
    @Transactional
    public HostResponse changeStatus(UUID id, HostStatus newStatus) {
        Host host = findHostById(id);
        host.changeStatus(newStatus);
        log.info("호스트 상태 변경: id={}, status={}", id, newStatus);
        return HostResponse.from(host);
    }

    /**
     * 호스트 통계
     */
    public HostStats getStats() {
        long active = hostRepository.countByStatus(HostStatus.ACTIVE);
        long inactive = hostRepository.countByStatus(HostStatus.INACTIVE);
        long maintenance = hostRepository.countByStatus(HostStatus.MAINTENANCE);
        long total = hostRepository.count();

        return new HostStats(total, active, inactive, maintenance);
    }

    private Host findHostById(UUID id) {
        return hostRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.HOST_NOT_FOUND));
    }

    /**
     * 호스트 통계 DTO
     */
    public record HostStats(long total, long active, long inactive, long maintenance) {}
}
