#!/bin/bash
# ================================================================
# K-ECP 자동 백업 스크립트 (cron용)
#
# crontab 설정:
#   0 2 * * * /home/bullpae/repo/kohub/scripts/backup-cron.sh >> /var/log/kecp-backup.log 2>&1
#
# 백업 위치: /home/bullpae/repo/kohub/backups/
# 보관: 30일
# ================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 백업 시작"

mkdir -p "$BACKUP_PATH"

# PostgreSQL 전체 백업
echo "  PostgreSQL 백업..."
podman exec kecp-postgres pg_dumpall -U kecp_admin \
    | gzip > "$BACKUP_PATH/postgres_full_${TIMESTAMP}.sql.gz"

# 개별 DB 백업
for db in keycloak kusthub kohub; do
    podman exec kecp-postgres pg_dump -U kecp_admin "$db" \
        | gzip > "$BACKUP_PATH/${db}_${TIMESTAMP}.sql.gz"
done

# Uptime Kuma 데이터 백업
if podman container exists kecp-uptime-kuma 2>/dev/null; then
    podman cp kecp-uptime-kuma:/app/data "$BACKUP_PATH/uptime-kuma-data" 2>/dev/null || true
fi

# 백업 크기 확인
SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
echo "  백업 완료: $BACKUP_PATH ($SIZE)"

# 오래된 백업 정리 (30일)
DELETED=$(find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \; -print 2>/dev/null | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "  오래된 백업 ${DELETED}개 삭제"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 백업 완료"
