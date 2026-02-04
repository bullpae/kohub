package com.kohub.domain.user.service;

import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.domain.user.dto.UserResponse;
import com.kohub.domain.user.entity.User;
import com.kohub.domain.user.entity.UserRole;
import com.kohub.domain.user.entity.UserStatus;
import com.kohub.domain.user.repository.UserRepository;
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
 * 사용자 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    /**
     * Keycloak 로그인 시 사용자 동기화 (upsert)
     */
    @Transactional
    public UserResponse syncFromKeycloak(String keycloakId, String email, String name, String keycloakRole) {
        UserRole role = UserRole.fromKeycloakRole(keycloakRole);
        
        User user = userRepository.findByKeycloakId(keycloakId)
                .map(existing -> {
                    existing.syncFromKeycloak(email, name, role);
                    existing.updateLastLogin();
                    log.debug("사용자 동기화: keycloakId={}", keycloakId);
                    return existing;
                })
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .keycloakId(keycloakId)
                            .email(email)
                            .name(name)
                            .role(role)
                            .status(UserStatus.ACTIVE)
                            .build();
                    newUser.updateLastLogin();
                    log.info("새 사용자 생성: keycloakId={}, email={}", keycloakId, email);
                    return userRepository.save(newUser);
                });

        return UserResponse.from(user);
    }

    /**
     * 사용자 조회 (ID)
     */
    public UserResponse getById(UUID id) {
        User user = findUserById(id);
        return UserResponse.from(user);
    }

    /**
     * 사용자 조회 (Keycloak ID)
     */
    public UserResponse getByKeycloakId(String keycloakId) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }

    /**
     * 사용자 목록 조회
     */
    public Page<UserResponse> getList(UserStatus status, UserRole role, UUID organizationId, 
                                       String keyword, Pageable pageable) {
        return userRepository.findByFilters(status, role, organizationId, keyword, pageable)
                .map(UserResponse::from);
    }

    /**
     * 운영자 목록 조회
     */
    public List<UserResponse.Summary> getOperators() {
        return userRepository.findOperators().stream()
                .map(UserResponse.Summary::from)
                .collect(Collectors.toList());
    }

    /**
     * 조직별 사용자 목록
     */
    public Page<UserResponse> getByOrganization(UUID organizationId, Pageable pageable) {
        return userRepository.findByOrganizationId(organizationId, pageable)
                .map(UserResponse::from);
    }

    /**
     * 프로필 업데이트
     */
    @Transactional
    public UserResponse updateProfile(UUID id, String name, String displayName) {
        User user = findUserById(id);
        user.updateProfile(name, displayName);
        log.info("프로필 업데이트: userId={}", id);
        return UserResponse.from(user);
    }

    /**
     * 조직 변경
     */
    @Transactional
    public UserResponse changeOrganization(UUID userId, UUID organizationId) {
        User user = findUserById(userId);
        user.changeOrganization(organizationId);
        log.info("조직 변경: userId={}, orgId={}", userId, organizationId);
        return UserResponse.from(user);
    }

    /**
     * 사용자 비활성화
     */
    @Transactional
    public void deactivate(UUID id) {
        User user = findUserById(id);
        user.deactivate();
        log.info("사용자 비활성화: userId={}", id);
    }

    private User findUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
