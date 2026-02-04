package com.kohub.domain.host.controller;

import com.kohub.common.response.ApiResponse;
import com.kohub.domain.host.dto.HostAdapterRequest;
import com.kohub.domain.host.dto.HostAdapterResponse;
import com.kohub.domain.host.service.HostAdapterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * 호스트 어댑터 API
 */
@RestController
@RequestMapping("/api/v1/hosts/{hostId}/adapters")
@RequiredArgsConstructor
@Tag(name = "HostAdapter", description = "호스트 어댑터 연결 관리 API")
public class HostAdapterController {

    private final HostAdapterService hostAdapterService;

    @PostMapping
    @Operation(summary = "어댑터 연결", description = "호스트에 외부 도구를 연결합니다")
    public ResponseEntity<ApiResponse<HostAdapterResponse>> create(
            @PathVariable UUID hostId,
            @Valid @RequestBody HostAdapterRequest request) {
        HostAdapterResponse response = hostAdapterService.create(hostId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "어댑터 목록", description = "호스트에 연결된 어댑터 목록을 조회합니다")
    public ResponseEntity<ApiResponse<List<HostAdapterResponse.Summary>>> getByHost(
            @PathVariable UUID hostId) {
        List<HostAdapterResponse.Summary> response = hostAdapterService.getByHost(hostId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{adapterId}")
    @Operation(summary = "어댑터 상세", description = "어댑터 상세 정보를 조회합니다")
    public ResponseEntity<ApiResponse<HostAdapterResponse>> getById(
            @PathVariable UUID hostId,
            @PathVariable UUID adapterId) {
        HostAdapterResponse response = hostAdapterService.getById(adapterId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{adapterId}")
    @Operation(summary = "어댑터 설정 수정", description = "어댑터 설정을 수정합니다")
    public ResponseEntity<ApiResponse<HostAdapterResponse>> update(
            @PathVariable UUID hostId,
            @PathVariable UUID adapterId,
            @Valid @RequestBody HostAdapterRequest request) {
        HostAdapterResponse response = hostAdapterService.updateConfig(adapterId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{adapterId}/link")
    @Operation(summary = "외부 ID 연결", description = "외부 시스템의 ID를 연결합니다")
    public ResponseEntity<ApiResponse<HostAdapterResponse>> linkExternal(
            @PathVariable UUID hostId,
            @PathVariable UUID adapterId,
            @RequestParam String externalId) {
        // adapterId에서 adapterType을 조회해서 처리
        HostAdapterResponse current = hostAdapterService.getById(adapterId);
        HostAdapterResponse response = hostAdapterService.linkExternal(
                hostId, current.getAdapterType(), externalId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{adapterId}")
    @Operation(summary = "어댑터 삭제", description = "어댑터 연결을 삭제합니다")
    public ResponseEntity<Void> delete(
            @PathVariable UUID hostId,
            @PathVariable UUID adapterId) {
        hostAdapterService.delete(adapterId);
        return ResponseEntity.noContent().build();
    }
}
