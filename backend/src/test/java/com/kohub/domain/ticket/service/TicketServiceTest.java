package com.kohub.domain.ticket.service;

import com.kohub.common.exception.BusinessException;
import com.kohub.common.exception.ErrorCode;
import com.kohub.domain.ticket.dto.TicketDetailResponse;
import com.kohub.domain.ticket.dto.TicketRequest;
import com.kohub.domain.ticket.dto.TicketResponse;
import com.kohub.domain.ticket.entity.Ticket;
import com.kohub.domain.ticket.entity.TicketPriority;
import com.kohub.domain.ticket.entity.TicketSource;
import com.kohub.domain.ticket.entity.TicketStatus;
import com.kohub.domain.ticket.repository.TicketRepository;
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
 * 티켓 서비스 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TicketService 단위 테스트")
class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @InjectMocks
    private TicketService ticketService;

    private Ticket testTicket;
    private TicketRequest testRequest;
    private UUID testId;
    private UUID reporterId;

    @BeforeEach
    void setUp() {
        testId = UUID.randomUUID();
        reporterId = UUID.randomUUID();

        testTicket = Ticket.builder()
                .id(testId)
                .title("서버 다운")
                .description("web-prod-01 응답 없음")
                .source(TicketSource.UPTIME_KUMA)
                .sourceEventId("uptime-123")
                .priority(TicketPriority.CRITICAL)
                .status(TicketStatus.NEW)
                .hostId(UUID.randomUUID())
                .reporterId(reporterId)
                .build();

        testRequest = TicketRequest.builder()
                .title("서버 다운")
                .description("web-prod-01 응답 없음")
                .source(TicketSource.UPTIME_KUMA)
                .sourceEventId("uptime-123")
                .priority(TicketPriority.CRITICAL)
                .build();
    }

    @Nested
    @DisplayName("티켓 생성 테스트")
    class CreateTests {

        @Test
        @DisplayName("정상적인 티켓 생성 - 성공")
        void testCreate_Success() {
            // given: 중복 없음, 저장 성공
            given(ticketRepository.existsBySourceEventId(any())).willReturn(false);
            given(ticketRepository.save(any(Ticket.class))).willReturn(testTicket);

            // when: 티켓 생성
            TicketResponse response = ticketService.create(testRequest, reporterId);

            // then: 응답 검증
            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("서버 다운");
            assertThat(response.getPriority()).isEqualTo(TicketPriority.CRITICAL);
            verify(ticketRepository).save(any(Ticket.class));
        }

        @Test
        @DisplayName("중복 소스 이벤트 ID - 기존 티켓 반환")
        void testCreate_DuplicateSourceEvent() {
            // given: 이미 존재하는 이벤트 ID
            given(ticketRepository.existsBySourceEventId("uptime-123")).willReturn(true);
            given(ticketRepository.findBySourceEventId("uptime-123")).willReturn(Optional.of(testTicket));

            // when: 티켓 생성 시도
            TicketResponse response = ticketService.create(testRequest, reporterId);

            // then: 기존 티켓 반환, 새 저장 없음
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(testId);
            verify(ticketRepository, never()).save(any(Ticket.class));
        }

        @Test
        @DisplayName("소스 이벤트 ID 없이 생성 - 성공")
        void testCreate_WithoutSourceEventId() {
            // given: 소스 이벤트 ID 없음
            TicketRequest requestWithoutEventId = TicketRequest.builder()
                    .title("수동 생성 티켓")
                    .priority(TicketPriority.MEDIUM)
                    .build();

            Ticket savedTicket = Ticket.builder()
                    .id(UUID.randomUUID())
                    .title("수동 생성 티켓")
                    .status(TicketStatus.NEW)
                    .build();

            given(ticketRepository.save(any(Ticket.class))).willReturn(savedTicket);

            // when: 티켓 생성
            TicketResponse response = ticketService.create(requestWithoutEventId, reporterId);

            // then: 정상 생성
            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("수동 생성 티켓");
        }
    }

    @Nested
    @DisplayName("티켓 조회 테스트")
    class GetTests {

        @Test
        @DisplayName("ID로 티켓 조회 - 성공")
        void testGetById_Success() {
            // given: 티켓 존재
            given(ticketRepository.findById(testId)).willReturn(Optional.of(testTicket));

            // when: 조회
            TicketDetailResponse response = ticketService.getById(testId);

            // then: 응답 검증
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(testId);
            assertThat(response.getTitle()).isEqualTo("서버 다운");
        }

        @Test
        @DisplayName("존재하지 않는 ID로 조회 - 실패")
        void testGetById_NotFound() {
            // given: 티켓 없음
            given(ticketRepository.findById(testId)).willReturn(Optional.empty());

            // when & then: 예외 발생
            assertThatThrownBy(() -> ticketService.getById(testId))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TICKET_NOT_FOUND);
        }

        @Test
        @DisplayName("티켓 목록 조회 - 성공")
        void testGetList_Success() {
            // given: 페이징 결과
            Pageable pageable = PageRequest.of(0, 10);
            Page<Ticket> ticketPage = new PageImpl<>(List.of(testTicket), pageable, 1);
            given(ticketRepository.findByFilters(any(), any(), any(), any(), any())).willReturn(ticketPage);

            // when: 목록 조회
            Page<TicketResponse> result = ticketService.getList(null, null, null, null, pageable);

            // then: 결과 검증
            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("티켓 상태 전이 테스트")
    class TransitionTests {

        @Test
        @DisplayName("NEW → RECEIVED 접수 - 성공")
        void testReceive_Success() {
            // given: NEW 상태 티켓
            given(ticketRepository.findById(testId)).willReturn(Optional.of(testTicket));

            // when: 접수
            TicketResponse response = ticketService.receive(testId, reporterId);

            // then: 상태 변경 확인
            assertThat(response.getStatus()).isEqualTo(TicketStatus.RECEIVED);
        }

        @Test
        @DisplayName("담당자 배정 - 성공")
        void testAssign_Success() {
            // given: RECEIVED 상태 티켓
            testTicket.receive(reporterId);
            given(ticketRepository.findById(testId)).willReturn(Optional.of(testTicket));
            UUID assigneeId = UUID.randomUUID();

            // when: 배정
            TicketResponse response = ticketService.assign(testId, assigneeId, reporterId);

            // then: 담당자 배정 및 상태 변경 확인
            assertThat(response.getAssigneeId()).isEqualTo(assigneeId);
            assertThat(response.getStatus()).isEqualTo(TicketStatus.ASSIGNED);
        }

        @Test
        @DisplayName("잘못된 상태 전이 - 실패")
        void testTransition_InvalidStatus() {
            // given: NEW 상태에서 바로 RESOLVED로 전이 시도
            given(ticketRepository.findById(testId)).willReturn(Optional.of(testTicket));

            // when & then: 예외 발생
            assertThatThrownBy(() -> ticketService.transition(testId, TicketStatus.RESOLVED, null, reporterId))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TICKET_INVALID_STATUS_TRANSITION);
        }
    }

    @Nested
    @DisplayName("티켓 해결 테스트")
    class ResolveTests {

        @Test
        @DisplayName("IN_PROGRESS 상태에서 해결 - 성공")
        void testResolve_FromInProgress() {
            // given: IN_PROGRESS 상태 티켓
            testTicket.receive(reporterId);
            testTicket.assign(UUID.randomUUID(), reporterId);
            testTicket.transitionTo(TicketStatus.IN_PROGRESS, null, reporterId);
            given(ticketRepository.findById(testId)).willReturn(Optional.of(testTicket));

            // when: 해결
            TicketResponse response = ticketService.resolve(testId, "nginx 재시작으로 해결", reporterId);

            // then: 해결 확인
            assertThat(response.getStatus()).isEqualTo(TicketStatus.RESOLVED);
            assertThat(response.getResolutionSummary()).isEqualTo("nginx 재시작으로 해결");
        }

        @Test
        @DisplayName("NEW 상태에서 해결 시도 - 실패")
        void testResolve_FromNewStatus() {
            // given: NEW 상태 티켓
            given(ticketRepository.findById(testId)).willReturn(Optional.of(testTicket));

            // when & then: 예외 발생
            assertThatThrownBy(() -> ticketService.resolve(testId, "해결", reporterId))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.TICKET_INVALID_STATUS_TRANSITION);
        }
    }

    @Nested
    @DisplayName("티켓 코멘트 테스트")
    class CommentTests {

        @Test
        @DisplayName("코멘트 추가 - 성공")
        void testAddComment_Success() {
            // given: 티켓 존재
            given(ticketRepository.findById(testId)).willReturn(Optional.of(testTicket));

            // when: 코멘트 추가
            TicketDetailResponse response = ticketService.addComment(testId, "분석 중입니다", reporterId);

            // then: 활동 기록 확인
            assertThat(response.getActivities()).isNotEmpty();
            assertThat(response.getActivities().get(0).getContent()).isEqualTo("분석 중입니다");
        }
    }

    @Nested
    @DisplayName("티켓 통계 테스트")
    class StatsTests {

        @Test
        @DisplayName("티켓 통계 조회 - 성공")
        void testGetStats_Success() {
            // given: 통계 데이터
            given(ticketRepository.count()).willReturn(50L);
            given(ticketRepository.countByStatus(TicketStatus.NEW)).willReturn(10L);
            given(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)).willReturn(15L);
            given(ticketRepository.countByStatus(TicketStatus.RESOLVED)).willReturn(20L);
            given(ticketRepository.countByPriority(TicketPriority.CRITICAL)).willReturn(5L);
            given(ticketRepository.countByPriority(TicketPriority.HIGH)).willReturn(10L);

            // when: 통계 조회
            TicketService.TicketStats stats = ticketService.getStats();

            // then: 통계 검증
            assertThat(stats.total()).isEqualTo(50L);
            assertThat(stats.newCount()).isEqualTo(10L);
            assertThat(stats.inProgress()).isEqualTo(15L);
            assertThat(stats.resolved()).isEqualTo(20L);
            assertThat(stats.critical()).isEqualTo(5L);
            assertThat(stats.high()).isEqualTo(10L);
        }
    }
}
