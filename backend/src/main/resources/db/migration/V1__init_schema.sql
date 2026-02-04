-- =============================================
-- kohub 초기 스키마
-- PostgreSQL 16+
-- =============================================

-- 조직 테이블
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description VARCHAR(500),
    parent_id UUID REFERENCES organizations(id),
    type VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' CHECK (type IN ('INTERNAL', 'CUSTOMER', 'PARTNER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')),
    manager_id UUID,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organizations_code ON organizations(code);
CREATE INDEX idx_organizations_status ON organizations(status);

-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(50),
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(30) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'OPERATOR', 'MEMBER', 'CUSTOMER_ADMIN', 'CUSTOMER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING')),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_keycloak_id ON users(keycloak_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);

-- 호스트 테이블
CREATE TABLE hosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    connection_type VARCHAR(20) NOT NULL DEFAULT 'SSH' CHECK (connection_type IN ('SSH', 'HTTPS', 'AGENT')),
    ssh_host VARCHAR(255),
    ssh_port INTEGER DEFAULT 22,
    ssh_username VARCHAR(100),
    ssh_private_key_path VARCHAR(500),
    organization_id UUID REFERENCES organizations(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hosts_name ON hosts(name);
CREATE INDEX idx_hosts_status ON hosts(status);
CREATE INDEX idx_hosts_organization ON hosts(organization_id);

-- 호스트 태그 테이블
CREATE TABLE host_tags (
    host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (host_id, tag)
);

CREATE INDEX idx_host_tags_tag ON host_tags(tag);

-- 호스트 어댑터 연결 테이블
CREATE TABLE host_adapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
    adapter_type VARCHAR(30) NOT NULL,
    external_id VARCHAR(100),
    config JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ERROR')),
    last_sync_at TIMESTAMP,
    error_message VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (host_id, adapter_type)
);

CREATE INDEX idx_host_adapters_host ON host_adapters(host_id);
CREATE INDEX idx_host_adapters_type ON host_adapters(adapter_type);
CREATE INDEX idx_host_adapters_external ON host_adapters(adapter_type, external_id);

-- 티켓 테이블
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    source VARCHAR(30) NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'UPTIME_KUMA', 'PROMETHEUS', 'CUSTOMER_REQUEST')),
    source_event_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'RECEIVED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'COMPLETED', 'CLOSED', 'REOPENED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    host_id UUID REFERENCES hosts(id),
    reporter_id UUID REFERENCES users(id),
    assignee_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    resolution_summary TEXT,
    external_system VARCHAR(50),
    external_ticket_id VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'NONE' CHECK (sync_status IN ('NONE', 'PENDING', 'SYNCED', 'FAILED')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_source ON tickets(source);
CREATE INDEX idx_tickets_source_event ON tickets(source_event_id);
CREATE INDEX idx_tickets_host ON tickets(host_id);
CREATE INDEX idx_tickets_assignee ON tickets(assignee_id);
CREATE INDEX idx_tickets_organization ON tickets(organization_id);
CREATE INDEX idx_tickets_created ON tickets(created_at DESC);

-- 티켓 활동 테이블
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type VARCHAR(30) NOT NULL CHECK (type IN ('STATUS_CHANGE', 'COMMENT', 'ASSIGNMENT', 'TERMINAL_ACCESS', 'PRIORITY_CHANGE')),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_ticket ON activities(ticket_id);
CREATE INDEX idx_activities_created ON activities(created_at DESC);

-- 터미널 로그 테이블
CREATE TABLE terminal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id),
    host_id UUID NOT NULL REFERENCES hosts(id),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100) NOT NULL,
    command_log TEXT,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP
);

CREATE INDEX idx_terminal_logs_ticket ON terminal_logs(ticket_id);
CREATE INDEX idx_terminal_logs_session ON terminal_logs(session_id);

-- 어댑터 이벤트 테이블 (Webhook 수신 로그)
CREATE TABLE adapter_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adapter_type VARCHAR(30) NOT NULL,
    host_adapter_id UUID REFERENCES host_adapters(id),
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'IGNORED')),
    created_ticket_id UUID REFERENCES tickets(id),
    error_message VARCHAR(500),
    received_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMP
);

CREATE INDEX idx_adapter_events_type ON adapter_events(adapter_type);
CREATE INDEX idx_adapter_events_status ON adapter_events(status);
CREATE INDEX idx_adapter_events_received ON adapter_events(received_at DESC);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 적용
CREATE TRIGGER tr_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_hosts_updated_at BEFORE UPDATE ON hosts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_host_adapters_updated_at BEFORE UPDATE ON host_adapters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
