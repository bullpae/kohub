/**
 * 외부 서비스 연동 설정 유틸리티
 * localStorage에 저장하며 환경변수를 기본값으로 사용
 */

const SETTINGS_KEY = 'kohub-integration-settings'

export interface IntegrationSettings {
  uptimeKumaUrl: string
  termixUrl: string
  prometheusUrl: string
}

const defaults: IntegrationSettings = {
  uptimeKumaUrl: import.meta.env.VITE_UPTIME_KUMA_URL || 'http://localhost:3001',
  termixUrl: import.meta.env.VITE_TERMIX_URL || 'http://localhost:8080',
  prometheusUrl: import.meta.env.VITE_PROMETHEUS_URL || 'http://localhost:9090',
}

export function getSettings(): IntegrationSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) {
      return { ...defaults, ...JSON.parse(stored) }
    }
  } catch {
    // ignore parse errors
  }
  return { ...defaults }
}

export function saveSettings(settings: Partial<IntegrationSettings>): void {
  const current = getSettings()
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }))
}

export function resetSettings(): void {
  localStorage.removeItem(SETTINGS_KEY)
}
