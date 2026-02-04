package com.kohub.domain.host.entity;

import lombok.*;

import java.io.Serializable;

/**
 * SSH 연결 설정
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SshConfig implements Serializable {
    
    /** 호스트 주소 */
    private String host;
    
    /** SSH 포트 (기본값: 22) */
    @Builder.Default
    private Integer port = 22;
    
    /** SSH 사용자명 */
    private String username;
}
