package com.kohub.domain.host.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

/**
 * SSH 연결 설정
 */
@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SshConfig implements Serializable {
    
    /** 호스트 주소 */
    @Column(name = "ssh_host")
    private String host;
    
    /** SSH 포트 (기본값: 22) */
    @Column(name = "ssh_port")
    @Builder.Default
    private Integer port = 22;
    
    /** SSH 사용자명 */
    @Column(name = "ssh_username")
    private String username;
}
