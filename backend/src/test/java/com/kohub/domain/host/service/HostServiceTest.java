package com.kohub.domain.host.service;

import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.domain.host.dto.HostRequest;
import com.kohub.domain.host.dto.HostResponse;
import com.kohub.domain.host.dto.HostStatsResponse;

import java.util.HashMap;
import java.util.Map;
import com.kohub.domain.host.entity.ConnectionType;
import com.kohub.domain.host.entity.Host;
import com.kohub.domain.host.entity.HostStatus;
import com.kohub.domain.host.entity.SshConfig;
import com.kohub.domain.host.repository.HostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

/**
 * 호스트 서비스 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("HostService 단위 테스트")
class HostServiceTest {

    @Mock
    private HostRepository hostRepository;

    @InjectMocks
    private HostService hostService;

    private Host testHost;
    private HostRequest testRequest;
    private UUID testId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        
        testHost = Host.builder()
                .id(testId)
                .name("web-prod-01")
                .description("프로덕션 웹 서버")
                .connectionType(ConnectionType.SSH)
                .sshConfig(SshConfig.builder()
                        .host("10.0.0.1")
                        .port(22)
                        .username("admin")
                        .build())
                .tags(List.of("production", "web"))
                .status(HostStatus.ACTIVE)
                .build();

        testRequest = HostRequest.builder()
                .name("web-prod-01")
                .description("프로덕션 웹 서버")
                .connectionType(ConnectionType.SSH)
                .sshConfig(HostRequest.SshConfigRequest.builder()
                        .host("10.0.0.1")
                        .port(22)
                        .username("admin")
                        .build())
                .tags(List.of("production", "web"))
                .build();
    }

    @Nested
    @DisplayName("호스트 생성 테스트")
    class CreateTests {

        @Test
        @DisplayName("정상적인 호스트 생성 - 성공")
        void testCreate_Success() {
            // given: 이름 중복 없음, 저장 성공
            given(hostRepository.existsByName(testRequest.getName())).willReturn(false);
            given(hostRepository.save(any(Host.class))).willReturn(testHost);

            // when: 호스트 생성
            HostResponse response = hostService.create(testRequest);

            // then: 응답 검증
            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo(testRequest.getName());
            assertThat(response.getConnectionType()).isEqualTo(ConnectionType.SSH);
            verify(hostRepository).save(any(Host.class));
        }

        @Test
        @DisplayName("중복 이름으로 생성 시도 - 실패")
        void testCreate_DuplicateName() {
            // given: 이름 중복
            given(hostRepository.existsByName(testRequest.getName())).willReturn(true);

            // when & then: 예외 발생
            assertThatThrownBy(() -> hostService.create(testRequest))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.HOST_ALREADY_EXISTS);

            verify(hostRepository, never()).save(any(Host.class));
        }
    }

    @Nested
    @DisplayName("호스트 조회 테스트")
    class GetTests {

        @Test
        @DisplayName("ID로 호스트 조회 - 성공")
        void testGetById_Success() {
            // given: 호스트 존재
            given(hostRepository.findById(testId)).willReturn(Optional.of(testHost));

            // when: 조회
            HostResponse response = hostService.getById(testId);

            // then: 응답 검증
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(testId);
            assertThat(response.getName()).isEqualTo("web-prod-01");
        }

        @Test
        @DisplayName("존재하지 않는 ID로 조회 - 실패")
        void testGetById_NotFound() {
            // given: 호스트 없음
            given(hostRepository.findById(testId)).willReturn(Optional.empty());

            // when & then: 예외 발생
            assertThatThrownBy(() -> hostService.getById(testId))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.HOST_NOT_FOUND);
        }

        @Test
        @DisplayName("호스트 목록 조회 - 성공")
        void testGetList_Success() {
            // given: 페이징 결과
            Pageable pageable = PageRequest.of(0, 10);
            Page<Host> hostPage = new PageImpl<>(List.of(testHost), pageable, 1);
            given(hostRepository.findByStatusAndKeyword(any(), any(), any())).willReturn(hostPage);

            // when: 목록 조회
            Page<HostResponse> result = hostService.getList(null, null, pageable);

            // then: 결과 검증
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("web-prod-01");
        }
    }

    @Nested
    @DisplayName("호스트 수정 테스트")
    class UpdateTests {

        @Test
        @DisplayName("호스트 정보 수정 - 성공")
        void testUpdate_Success() {
            // given: 호스트 존재, 이름 변경 없음
            given(hostRepository.findById(testId)).willReturn(Optional.of(testHost));

            HostRequest updateRequest = HostRequest.builder()
                    .name("web-prod-01")
                    .description("수정된 설명")
                    .connectionType(ConnectionType.SSH)
                    .build();

            // when: 수정
            HostResponse response = hostService.update(testId, updateRequest);

            // then: 수정 확인
            assertThat(response).isNotNull();
            assertThat(testHost.getDescription()).isEqualTo("수정된 설명");
        }

        @Test
        @DisplayName("이름 변경 시 중복 검사 - 실패")
        void testUpdate_DuplicateName() {
            // given: 호스트 존재, 이름 변경 시 중복
            given(hostRepository.findById(testId)).willReturn(Optional.of(testHost));
            given(hostRepository.existsByName("new-name")).willReturn(true);

            HostRequest updateRequest = HostRequest.builder()
                    .name("new-name")
                    .build();

            // when & then: 예외 발생
            assertThatThrownBy(() -> hostService.update(testId, updateRequest))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.HOST_ALREADY_EXISTS);
        }
    }

    @Nested
    @DisplayName("호스트 상태 변경 테스트")
    class StatusTests {

        @Test
        @DisplayName("호스트 비활성화 - 성공")
        void testDelete_Success() {
            // given: 호스트 존재
            given(hostRepository.findById(testId)).willReturn(Optional.of(testHost));

            // when: 삭제 (비활성화)
            hostService.delete(testId);

            // then: 상태 변경 확인
            assertThat(testHost.getStatus()).isEqualTo(HostStatus.INACTIVE);
        }

        @Test
        @DisplayName("호스트 상태 변경 - 성공")
        void testChangeStatus_Success() {
            // given: 호스트 존재
            given(hostRepository.findById(testId)).willReturn(Optional.of(testHost));

            // when: 점검 상태로 변경
            HostResponse response = hostService.changeStatus(testId, HostStatus.MAINTENANCE);

            // then: 상태 변경 확인
            assertThat(response.getStatus()).isEqualTo(HostStatus.MAINTENANCE);
        }
    }

    @Nested
    @DisplayName("호스트 통계 테스트")
    class StatsTests {

        @Test
        @DisplayName("호스트 통계 조회 - 성공")
        void testGetStats_Success() {
            // given: 통계 데이터 (단일 쿼리 결과)
            Map<String, Long> statsMap = new HashMap<>();
            statsMap.put("total", 10L);
            statsMap.put("active", 7L);
            statsMap.put("inactive", 2L);
            statsMap.put("maintenance", 1L);
            given(hostRepository.getStats()).willReturn(statsMap);

            // when: 통계 조회
            HostStatsResponse stats = hostService.getStats();

            // then: 통계 검증
            assertThat(stats.getTotal()).isEqualTo(10L);
            assertThat(stats.getActive()).isEqualTo(7L);
            assertThat(stats.getInactive()).isEqualTo(2L);
            assertThat(stats.getMaintenance()).isEqualTo(1L);
        }
    }
}
