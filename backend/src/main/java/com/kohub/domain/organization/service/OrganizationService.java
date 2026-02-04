package com.kohub.domain.organization.service;

import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.domain.organization.dto.OrganizationRequest;
import com.kohub.domain.organization.dto.OrganizationResponse;
import com.kohub.domain.organization.entity.Organization;
import com.kohub.domain.organization.entity.OrganizationStatus;
import com.kohub.domain.organization.entity.OrganizationType;
import com.kohub.domain.organization.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 조직 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    /**
     * 조직 생성
     */
    @Transactional
    public OrganizationResponse create(OrganizationRequest request) {
        // 코드 중복 검사
        if (organizationRepository.existsByCode(request.getCode())) {
            throw new BusinessException(ErrorCode.ORGANIZATION_ALREADY_EXISTS);
        }

        Organization org = Organization.builder()
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .parentId(request.getParentId())
                .type(request.getType() != null ? request.getType() : OrganizationType.CUSTOMER)
                .managerId(request.getManagerId())
                .phone(request.getPhone())
                .email(request.getEmail())
                .status(OrganizationStatus.ACTIVE)
                .build();

        Organization saved = organizationRepository.save(org);
        log.info("조직 생성 완료: id={}, code={}", saved.getId(), saved.getCode());

        return OrganizationResponse.from(saved);
    }

    /**
     * 조직 조회 (ID)
     */
    public OrganizationResponse getById(UUID id) {
        Organization org = findOrganizationById(id);
        return OrganizationResponse.from(org);
    }

    /**
     * 조직 조회 (코드)
     */
    public OrganizationResponse getByCode(String code) {
        Organization org = organizationRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORGANIZATION_NOT_FOUND));
        return OrganizationResponse.from(org);
    }

    /**
     * 조직 목록 조회
     */
    public Page<OrganizationResponse> getList(OrganizationStatus status, OrganizationType type,
                                               String keyword, Pageable pageable) {
        return organizationRepository.findByFilters(status, type, keyword, pageable)
                .map(OrganizationResponse::from);
    }

    /**
     * 활성 고객사 목록
     */
    public List<OrganizationResponse.Summary> getActiveCustomers() {
        return organizationRepository.findActiveCustomers().stream()
                .map(OrganizationResponse.Summary::from)
                .collect(Collectors.toList());
    }

    /**
     * 조직 수정
     */
    @Transactional
    public OrganizationResponse update(UUID id, OrganizationRequest request) {
        Organization org = findOrganizationById(id);
        org.update(request.getName(), request.getDescription(), request.getPhone(), request.getEmail());
        
        if (request.getManagerId() != null) {
            org.changeManager(request.getManagerId());
        }
        
        log.info("조직 수정 완료: id={}", id);
        return OrganizationResponse.from(org);
    }

    /**
     * 조직 비활성화
     */
    @Transactional
    public void deactivate(UUID id) {
        Organization org = findOrganizationById(id);
        org.deactivate();
        log.info("조직 비활성화: id={}", id);
    }

    private Organization findOrganizationById(UUID id) {
        return organizationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORGANIZATION_NOT_FOUND));
    }
}
