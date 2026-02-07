-- ================================================================
-- K-ECP 플랫폼 DB 초기화
-- PostgreSQL 시작 시 자동 실행 (docker-entrypoint-initdb.d)
--
-- 데이터베이스: keycloak, kusthub, kohub
-- ================================================================

-- Keycloak DB 및 사용자
CREATE USER keycloak WITH PASSWORD 'keycloak_db_password';
CREATE DATABASE keycloak OWNER keycloak;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;

-- KustHub DB 및 사용자
CREATE USER kusthub WITH PASSWORD 'kusthub123';
CREATE DATABASE kusthub OWNER kusthub;
GRANT ALL PRIVILEGES ON DATABASE kusthub TO kusthub;

-- kohub DB 및 사용자
CREATE USER kohub WITH PASSWORD 'kohub123';
CREATE DATABASE kohub OWNER kohub;
GRANT ALL PRIVILEGES ON DATABASE kohub TO kohub;

-- 각 사용자에게 스키마 접근 권한 부여
\connect keycloak
GRANT ALL ON SCHEMA public TO keycloak;

\connect kusthub
GRANT ALL ON SCHEMA public TO kusthub;

\connect kohub
GRANT ALL ON SCHEMA public TO kohub;
