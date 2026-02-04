package com.kohub.domain.host.entity;

/**
 * 호스트 연결 유형
 */
public enum ConnectionType {
    /** SSH 연결 */
    SSH,
    
    /** HTTPS 연결 */
    HTTPS,
    
    /** 에이전트 연결 */
    AGENT
}
