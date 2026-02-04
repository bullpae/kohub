package com.kohub.domain.ticket.dto;

import com.kohub.domain.ticket.entity.TicketPriority;
import com.kohub.domain.ticket.entity.TicketSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

/**
 * 티켓 생성/수정 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketRequest {

    @NotBlank(message = "티켓 제목은 필수입니다")
    @Size(max = 200, message = "제목은 200자 이하여야 합니다")
    private String title;

    private String description;

    @Builder.Default
    private TicketSource source = TicketSource.MANUAL;

    private String sourceEventId;

    @Builder.Default
    private TicketPriority priority = TicketPriority.MEDIUM;

    private UUID hostId;

    private UUID organizationId;
}
