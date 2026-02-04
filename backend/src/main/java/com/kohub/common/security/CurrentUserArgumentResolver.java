package com.kohub.common.security;

import com.kohub.domain.user.entity.User;
import com.kohub.domain.user.entity.UserRole;
import com.kohub.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * @CurrentUser 어노테이션 처리기
 * JWT에서 사용자 정보를 추출하고 DB와 동기화
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    private final UserRepository userRepository;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && parameter.getParameterType().equals(AuthenticatedUser.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                   ModelAndViewContainer mavContainer,
                                   NativeWebRequest webRequest,
                                   WebDataBinderFactory binderFactory) {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            log.debug("인증 정보 없음");
            return null;
        }
        
        // JWT에서 사용자 정보 추출
        String keycloakId = jwt.getSubject();
        String email = jwt.getClaim("email");
        String rawName = jwt.getClaim("name");
        final String userName = rawName != null ? rawName : jwt.getClaim("preferred_username");
        final String userEmail = email;
        
        // 역할 추출
        Set<String> roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .collect(Collectors.toSet());
        
        // DB에서 사용자 조회 또는 생성 (동기화)
        User user = userRepository.findByKeycloakId(keycloakId)
                .map(existing -> {
                    // 기존 사용자 정보 업데이트
                    if (userEmail != null && !userEmail.equals(existing.getEmail())) {
                        existing.syncFromKeycloak(userEmail, userName != null ? userName : existing.getName(), 
                                mapPrimaryRole(roles));
                    }
                    existing.updateLastLogin();
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    // 새 사용자 생성
                    log.info("새 사용자 동기화: keycloakId={}, email={}", keycloakId, userEmail);
                    User newUser = User.builder()
                            .keycloakId(keycloakId)
                            .email(userEmail != null ? userEmail : keycloakId + "@unknown")
                            .name(userName != null ? userName : "Unknown")
                            .role(mapPrimaryRole(roles))
                            .build();
                    newUser.updateLastLogin();
                    return userRepository.save(newUser);
                });
        
        return AuthenticatedUser.builder()
                .userId(user.getId())
                .keycloakId(keycloakId)
                .email(user.getEmail())
                .name(user.getName())
                .roles(roles)
                .build();
    }
    
    /**
     * Keycloak 역할을 kohub UserRole로 매핑
     */
    private UserRole mapPrimaryRole(Set<String> roles) {
        if (roles.contains("ADMIN")) {
            return UserRole.ADMIN;
        } else if (roles.contains("OPERATOR")) {
            return UserRole.OPERATOR;
        } else if (roles.contains("CUSTOMER_ADMIN")) {
            return UserRole.CUSTOMER_ADMIN;
        } else if (roles.contains("CUSTOMER") || roles.contains("MEMBER")) {
            return UserRole.CUSTOMER;
        }
        return UserRole.MEMBER;
    }
}
