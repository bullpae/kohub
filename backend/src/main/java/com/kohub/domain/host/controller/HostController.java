package com.kohub.domain.host.controller;

import com.kohub.common.response.ApiResponse;
import com.kohub.common.response.PageResponse;
import com.kohub.domain.host.dto.HostRequest;
import com.kohub.domain.host.dto.HostResponse;
import com.kohub.domain.host.dto.HostStatsResponse;
import com.kohub.domain.host.entity.HostStatus;
import com.kohub.domain.host.service.HostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * 호스트 관리 API
 */
@RestController
@RequestMapping("/api/v1/hosts")
@RequiredArgsConstructor
@Tag(name = "Host", description = "호스트(서버) 관리 API")
public class HostController {

    private final HostService hostService;

    @PostMapping
    @Operation(summary = "호스트 생성", description = "새 호스트를 등록합니다")
    public ResponseEntity<ApiResponse<HostResponse>> create(
            @Valid @RequestBody HostRequest request) {
        HostResponse response = hostService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "호스트 상세 조회", description = "호스트 정보를 조회합니다")
    public ResponseEntity<ApiResponse<HostResponse>> getById(@PathVariable UUID id) {
        HostResponse response = hostService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "호스트 목록 조회", description = "호스트 목록을 페이징하여 조회합니다")
    public ResponseEntity<ApiResponse<PageResponse<HostResponse>>> getList(
            @RequestParam(required = false) HostStatus status,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<HostResponse> page = hostService.getList(status, keyword, pageable);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "호스트 수정", description = "호스트 정보를 수정합니다")
    public ResponseEntity<ApiResponse<HostResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody HostRequest request) {
        HostResponse response = hostService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "호스트 삭제", description = "호스트를 비활성화합니다")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        hostService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "호스트 상태 변경", description = "호스트 상태를 변경합니다")
    public ResponseEntity<ApiResponse<HostResponse>> changeStatus(
            @PathVariable UUID id,
            @RequestParam HostStatus status) {
        HostResponse response = hostService.changeStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/stats")
    @Operation(summary = "호스트 통계", description = "호스트 상태별 통계를 조회합니다")
    public ResponseEntity<ApiResponse<HostStatsResponse>> getStats() {
        HostStatsResponse stats = hostService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
