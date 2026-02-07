package com.kohub.domain.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kohub.domain.auth.dto.LoginResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

/**
 * Keycloak 인증 서비스
 * - Direct Access Grants (Resource Owner Password Credentials)를 이용한 로그인
 * - 비밀번호 변경 필요 사용자 감지 및 처리
 * - Refresh Token으로 토큰 갱신
 */
@Slf4j
@Service
public class KeycloakAuthService {

    @Value("${keycloak.admin.server-url:http://localhost:8180}")
    private String serverUrl;

    @Value("${keycloak.target-realm:k-ecp}")
    private String targetRealm;

    @Value("${keycloak.client-id:k-ecp-kohub}")
    private String clientId;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @PostConstruct
    public void init() {
        log.info("KeycloakAuthService 초기화: serverUrl={}, realm={}, clientId={}", serverUrl, targetRealm, clientId);
    }

    /**
     * 사용자 로그인 (Direct Access Grants)
     * - 비밀번호 변경 필요 시 passwordChangeRequired=true 반환
     */
    public LoginResponse login(String username, String password) {
        try {
            String tokenEndpoint = serverUrl + "/realms/" + targetRealm + "/protocol/openid-connect/token";
            String requestBody = "grant_type=password"
                    + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                    + "&username=" + URLEncoder.encode(username, StandardCharsets.UTF_8)
                    + "&password=" + URLEncoder.encode(password, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(tokenEndpoint))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = objectMapper.readTree(response.body());

            if (response.statusCode() == 200) {
                log.info("로그인 성공: username={}", username);
                return LoginResponse.builder()
                        .success(true)
                        .message("로그인에 성공했습니다.")
                        .accessToken(json.get("access_token").asText())
                        .refreshToken(json.get("refresh_token").asText())
                        .expiresIn(json.get("expires_in").asLong())
                        .tokenType(json.get("token_type").asText())
                        .build();
            }

            // 에러 응답 분석
            String errorDescription = json.has("error_description")
                    ? json.get("error_description").asText() : "";

            // "Account is not fully set up" → 비밀번호 변경 필요
            if (errorDescription.contains("not fully set up")) {
                log.info("비밀번호 변경 필요: username={}", username);
                return LoginResponse.builder()
                        .success(false)
                        .message("비밀번호 변경이 필요합니다. 새 비밀번호를 설정해주세요.")
                        .passwordChangeRequired(true)
                        .build();
            }

            // 그 외 에러 (잘못된 비밀번호 등)
            log.warn("로그인 실패: username={}, error={}", username, errorDescription);
            throw new RuntimeException("아이디 또는 비밀번호가 올바르지 않습니다.");

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("로그인 처리 중 오류: {}", e.getMessage());
            throw new RuntimeException("로그인 처리 중 오류가 발생했습니다.");
        }
    }

    /**
     * 비밀번호 변경 (관리자가 임시 비밀번호를 설정한 경우)
     * 1. 현재 비밀번호 검증 (토큰 엔드포인트로 확인)
     * 2. Admin API로 새 비밀번호 설정 + requiredActions 제거
     * 3. 새 비밀번호로 로그인하여 토큰 반환
     */
    public LoginResponse changePassword(String username, String currentPassword, String newPassword) {
        // 1. 현재 비밀번호 검증
        verifyCurrentPassword(username, currentPassword);

        try {
            // 2. Admin 토큰 발급
            String adminToken = getAdminToken();

            // 3. 사용자 ID 조회
            String userId = findUserIdByUsername(adminToken, username);
            if (userId == null) {
                throw new RuntimeException("사용자를 찾을 수 없습니다.");
            }

            // 4. 새 비밀번호 설정 (temporary: false)
            resetUserPassword(adminToken, userId, newPassword);

            // 5. requiredActions 제거
            removeRequiredActions(adminToken, userId);

            log.info("비밀번호 변경 성공: username={}", username);

            // 6. 새 비밀번호로 로그인
            return login(username, newPassword);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("비밀번호 변경 실패: username={}, error={}", username, e.getMessage());
            throw new RuntimeException("비밀번호 변경에 실패했습니다.");
        }
    }

    /**
     * 토큰 갱신 (Refresh Token Grant)
     */
    public LoginResponse refreshToken(String refreshTokenValue) {
        try {
            String tokenEndpoint = serverUrl + "/realms/" + targetRealm + "/protocol/openid-connect/token";
            String requestBody = "grant_type=refresh_token"
                    + "&client_id=" + clientId
                    + "&refresh_token=" + URLEncoder.encode(refreshTokenValue, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(tokenEndpoint))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("토큰 갱신 실패: status={}", response.statusCode());
                throw new RuntimeException("토큰 갱신에 실패했습니다.");
            }

            JsonNode json = objectMapper.readTree(response.body());
            log.info("토큰 갱신 성공");

            return LoginResponse.builder()
                    .success(true)
                    .message("토큰이 갱신되었습니다.")
                    .accessToken(json.get("access_token").asText())
                    .refreshToken(json.get("refresh_token").asText())
                    .expiresIn(json.get("expires_in").asLong())
                    .tokenType(json.get("token_type").asText())
                    .build();
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("토큰 갱신 실패: error={}", e.getMessage());
            throw new RuntimeException("토큰 갱신에 실패했습니다.");
        }
    }

    // ===== Private Helper Methods =====

    /**
     * 현재 비밀번호 검증 (토큰 엔드포인트 응답으로 판별)
     * - "Account is not fully set up" → 비밀번호 맞음 (required action 때문에 토큰 발급 거부)
     * - "Invalid user credentials" → 비밀번호 틀림
     * - 200 OK → 비밀번호 맞음 (required action 없음)
     */
    private void verifyCurrentPassword(String username, String currentPassword) {
        try {
            String tokenEndpoint = serverUrl + "/realms/" + targetRealm + "/protocol/openid-connect/token";
            String requestBody = "grant_type=password"
                    + "&client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8)
                    + "&username=" + URLEncoder.encode(username, StandardCharsets.UTF_8)
                    + "&password=" + URLEncoder.encode(currentPassword, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(tokenEndpoint))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return; // 비밀번호 맞음
            }

            JsonNode json = objectMapper.readTree(response.body());
            String errorDescription = json.has("error_description")
                    ? json.get("error_description").asText() : "";

            if (errorDescription.contains("not fully set up")) {
                return; // 비밀번호 맞음 (required action 때문에 토큰 발급 거부된 것)
            }

            throw new RuntimeException("현재 비밀번호가 올바르지 않습니다.");
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("비밀번호 검증 중 오류가 발생했습니다.");
        }
    }

    /**
     * Keycloak Admin 토큰 발급 (master realm)
     */
    private String getAdminToken() throws Exception {
        String tokenEndpoint = serverUrl + "/realms/master/protocol/openid-connect/token";
        String requestBody = "grant_type=client_credentials"
                + "&client_id=admin-cli"
                + "&client_secret=";

        // admin-cli는 기본적으로 password grant 사용
        requestBody = "grant_type=password"
                + "&client_id=admin-cli"
                + "&username=admin"
                + "&password=admin123";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(tokenEndpoint))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("Keycloak Admin 토큰 발급 실패");
        }

        JsonNode json = objectMapper.readTree(response.body());
        return json.get("access_token").asText();
    }

    /**
     * username으로 Keycloak 사용자 ID 조회
     */
    private String findUserIdByUsername(String adminToken, String username) throws Exception {
        String url = serverUrl + "/admin/realms/" + targetRealm + "/users?username="
                + URLEncoder.encode(username, StandardCharsets.UTF_8) + "&exact=true";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + adminToken)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode users = objectMapper.readTree(response.body());

        if (users.isArray() && users.size() > 0) {
            return users.get(0).get("id").asText();
        }
        return null;
    }

    /**
     * 사용자 비밀번호 재설정 (Admin API)
     */
    private void resetUserPassword(String adminToken, String userId, String newPassword) throws Exception {
        String url = serverUrl + "/admin/realms/" + targetRealm + "/users/" + userId + "/reset-password";
        String body = objectMapper.writeValueAsString(
                java.util.Map.of("type", "password", "value", newPassword, "temporary", false));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + adminToken)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 204) {
            throw new RuntimeException("비밀번호 재설정 실패: status=" + response.statusCode());
        }
    }

    /**
     * 사용자 requiredActions 제거 (Admin API)
     */
    private void removeRequiredActions(String adminToken, String userId) throws Exception {
        String url = serverUrl + "/admin/realms/" + targetRealm + "/users/" + userId;
        String body = "{\"requiredActions\":[]}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + adminToken)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 204) {
            log.warn("requiredActions 제거 실패: status={}", response.statusCode());
        }
    }
}
