package com.kohub.domain.ticket.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 티켓 상태 전이 규칙 테스트
 */
@DisplayName("TicketStatus 상태 전이 테스트")
class TicketStatusTest {

    @Nested
    @DisplayName("NEW 상태에서의 전이")
    class FromNewTests {

        @Test
        @DisplayName("NEW → RECEIVED 전이 가능")
        void testNewToReceived_Allowed() {
            assertThat(TicketStatus.NEW.canTransitionTo(TicketStatus.RECEIVED)).isTrue();
        }

        @Test
        @DisplayName("NEW → CLOSED 전이 가능 (취소/중복)")
        void testNewToClosed_Allowed() {
            assertThat(TicketStatus.NEW.canTransitionTo(TicketStatus.CLOSED)).isTrue();
        }

        @Test
        @DisplayName("NEW → IN_PROGRESS 전이 불가")
        void testNewToInProgress_NotAllowed() {
            assertThat(TicketStatus.NEW.canTransitionTo(TicketStatus.IN_PROGRESS)).isFalse();
        }
    }

    @Nested
    @DisplayName("RECEIVED 상태에서의 전이")
    class FromReceivedTests {

        @Test
        @DisplayName("RECEIVED → ASSIGNED 전이 가능")
        void testReceivedToAssigned_Allowed() {
            assertThat(TicketStatus.RECEIVED.canTransitionTo(TicketStatus.ASSIGNED)).isTrue();
        }

        @Test
        @DisplayName("RECEIVED → IN_PROGRESS 전이 불가")
        void testReceivedToInProgress_NotAllowed() {
            assertThat(TicketStatus.RECEIVED.canTransitionTo(TicketStatus.IN_PROGRESS)).isFalse();
        }
    }

    @Nested
    @DisplayName("IN_PROGRESS 상태에서의 전이")
    class FromInProgressTests {

        @Test
        @DisplayName("IN_PROGRESS → PENDING 전이 가능")
        void testInProgressToPending_Allowed() {
            assertThat(TicketStatus.IN_PROGRESS.canTransitionTo(TicketStatus.PENDING)).isTrue();
        }

        @Test
        @DisplayName("IN_PROGRESS → RESOLVED 전이 가능")
        void testInProgressToResolved_Allowed() {
            assertThat(TicketStatus.IN_PROGRESS.canTransitionTo(TicketStatus.RESOLVED)).isTrue();
        }

        @Test
        @DisplayName("IN_PROGRESS → CLOSED 전이 불가")
        void testInProgressToClosed_NotAllowed() {
            assertThat(TicketStatus.IN_PROGRESS.canTransitionTo(TicketStatus.CLOSED)).isFalse();
        }
    }

    @Nested
    @DisplayName("RESOLVED 상태에서의 전이")
    class FromResolvedTests {

        @Test
        @DisplayName("RESOLVED → COMPLETED 전이 가능")
        void testResolvedToCompleted_Allowed() {
            assertThat(TicketStatus.RESOLVED.canTransitionTo(TicketStatus.COMPLETED)).isTrue();
        }

        @Test
        @DisplayName("RESOLVED → REOPENED 전이 가능")
        void testResolvedToReopened_Allowed() {
            assertThat(TicketStatus.RESOLVED.canTransitionTo(TicketStatus.REOPENED)).isTrue();
        }
    }

    @Nested
    @DisplayName("CLOSED 상태에서의 전이")
    class FromClosedTests {

        @Test
        @DisplayName("CLOSED 상태에서는 어디로도 전이 불가")
        void testClosedToAny_NotAllowed() {
            for (TicketStatus status : TicketStatus.values()) {
                assertThat(TicketStatus.CLOSED.canTransitionTo(status)).isFalse();
            }
        }
    }

    @ParameterizedTest
    @DisplayName("전체 상태 전이 매트릭스 테스트")
    @CsvSource({
            "NEW, RECEIVED, true",
            "NEW, CLOSED, true",
            "NEW, IN_PROGRESS, false",
            "RECEIVED, ASSIGNED, true",
            "ASSIGNED, IN_PROGRESS, true",
            "IN_PROGRESS, PENDING, true",
            "IN_PROGRESS, RESOLVED, true",
            "PENDING, IN_PROGRESS, true",
            "PENDING, RESOLVED, true",
            "RESOLVED, COMPLETED, true",
            "RESOLVED, REOPENED, true",
            "COMPLETED, CLOSED, true",
            "COMPLETED, REOPENED, true",
            "REOPENED, RECEIVED, true",
            "CLOSED, NEW, false"
    })
    void testTransitionMatrix(TicketStatus from, TicketStatus to, boolean expected) {
        assertThat(from.canTransitionTo(to))
                .as("%s → %s 전이 가능 여부", from, to)
                .isEqualTo(expected);
    }
}
