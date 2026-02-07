import { useState, useEffect, FormEvent } from 'react'
import {
  MonitorCheck, Terminal, Activity, Save, RotateCcw,
  CheckCircle, ExternalLink, Link2, AlertCircle, Copy, Info
} from 'lucide-react'
import { Card, CardHeader, Button } from '../components/common'
import { getSettings, saveSettings, resetSettings, type IntegrationSettings } from '../utils/settings'

/**
 * 설정 페이지
 *
 * - 외부 서비스 연동 설정 (Uptime Kuma, Termix, Prometheus)
 * - URL 설정 및 연결 테스트
 * - 웹훅 URL 안내
 */
export default function SettingsPage() {
  const [form, setForm] = useState<IntegrationSettings>(getSettings())
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | null>>({})

  useEffect(() => {
    setForm(getSettings())
  }, [])

  const handleSave = (e: FormEvent) => {
    e.preventDefault()
    saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    if (confirm('설정을 기본값으로 초기화하시겠습니까?')) {
      resetSettings()
      setForm(getSettings())
      setTestResults({})
    }
  }

  const handleTest = async (service: string, url: string) => {
    setTesting(service)
    setTestResults(prev => ({ ...prev, [service]: null }))
    try {
      // 간단한 연결 테스트 (CORS로 인해 실패할 수 있음)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      setTestResults(prev => ({ ...prev, [service]: 'success' }))
    } catch {
      setTestResults(prev => ({ ...prev, [service]: 'error' }))
    } finally {
      setTesting(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const webhookBaseUrl = window.location.origin

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div>
        <h1 className="kecp-section-title">설정</h1>
        <p className="kecp-section-subtitle">외부 서비스 연동 및 시스템 설정을 관리합니다</p>
      </div>

      {/* 저장 성공 메시지 */}
      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>설정이 저장되었습니다.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Uptime Kuma 설정 */}
        <IntegrationCard
          icon={MonitorCheck}
          name="Uptime Kuma"
          description="서비스 가동 상태 모니터링 도구. HTTP, TCP, Ping 등 다양한 방식으로 호스트 상태를 모니터링합니다."
          color="green"
          url={form.uptimeKumaUrl}
          onUrlChange={(url) => setForm(prev => ({ ...prev, uptimeKumaUrl: url }))}
          onTest={() => handleTest('uptimeKuma', form.uptimeKumaUrl)}
          testing={testing === 'uptimeKuma'}
          testResult={testResults.uptimeKuma}
          features={[
            '실시간 서비스 상태 모니터링',
            '장애 발생 시 자동 티켓 생성 (웹훅)',
            '대시보드 iframe 임베드',
          ]}
        />

        {/* Termix 설정 */}
        <IntegrationCard
          icon={Terminal}
          name="Termix"
          description="웹 기반 SSH 터미널 관리 도구. 브라우저에서 직접 서버에 접속하여 관리할 수 있습니다."
          color="blue"
          url={form.termixUrl}
          onUrlChange={(url) => setForm(prev => ({ ...prev, termixUrl: url }))}
          onTest={() => handleTest('termix', form.termixUrl)}
          testing={testing === 'termix'}
          testResult={testResults.termix}
          features={[
            '웹 브라우저 SSH 터미널 접속',
            '호스트 원클릭 터미널 접속',
            '터미널 세션 로깅',
          ]}
        />

        {/* Prometheus 설정 */}
        <IntegrationCard
          icon={Activity}
          name="Prometheus"
          description="시스템 메트릭 수집 및 알림 도구. CPU, 메모리, 디스크 등 서버 리소스를 모니터링합니다."
          color="orange"
          url={form.prometheusUrl}
          onUrlChange={(url) => setForm(prev => ({ ...prev, prometheusUrl: url }))}
          onTest={() => handleTest('prometheus', form.prometheusUrl)}
          testing={testing === 'prometheus'}
          testResult={testResults.prometheus}
          features={[
            '서버 메트릭 수집 (CPU, Memory, Disk)',
            'Alertmanager 알림 연동',
            '임계치 초과 시 자동 티켓 생성',
          ]}
        />

        {/* 웹훅 설정 */}
        <Card>
          <CardHeader title="웹훅 설정" />
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">외부 서비스에서 kohub으로 알림을 보내려면 웹훅 URL을 설정하세요.</p>
                <p>장애 발생 시 자동으로 티켓이 생성됩니다.</p>
              </div>
            </div>

            <WebhookUrl
              label="Uptime Kuma 웹훅"
              url={`${webhookBaseUrl}/api/v1/webhooks/uptime-kuma`}
              onCopy={copyToClipboard}
              description="Uptime Kuma → Settings → Notifications → Webhook에 이 URL을 입력하세요"
            />
            <WebhookUrl
              label="Prometheus Alertmanager 웹훅"
              url={`${webhookBaseUrl}/api/v1/webhooks/prometheus`}
              onCopy={copyToClipboard}
              description="Alertmanager → webhook_configs → url에 이 URL을 입력하세요"
            />
          </div>
        </Card>

        {/* 저장/초기화 버튼 */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" icon={RotateCcw} type="button" onClick={handleReset}>
            기본값으로 초기화
          </Button>
          <Button variant="primary" icon={Save} type="submit">
            설정 저장
          </Button>
        </div>
      </form>
    </div>
  )
}

/** 연동 서비스 카드 */
function IntegrationCard({
  icon: Icon,
  name,
  description,
  color,
  url,
  onUrlChange,
  onTest,
  testing,
  testResult,
  features,
}: {
  icon: typeof MonitorCheck
  name: string
  description: string
  color: string
  url: string
  onUrlChange: (url: string) => void
  onTest: () => void
  testing: boolean
  testResult: 'success' | 'error' | null | undefined
  features: string[]
}) {
  const colorMap: Record<string, { iconBg: string; featureDot: string }> = {
    green: { iconBg: 'bg-green-500', featureDot: 'bg-green-400' },
    blue: { iconBg: 'bg-blue-500', featureDot: 'bg-blue-400' },
    orange: { iconBg: 'bg-orange-500', featureDot: 'bg-orange-400' },
  }
  const colors = colorMap[color] || colorMap.blue

  return (
    <Card>
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-xl ${colors.iconBg}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--kecp-gray-900)]">{name}</h3>
          <p className="text-sm text-[var(--kecp-gray-500)] mt-0.5">{description}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--kecp-gray-600)] hover:text-[var(--kecp-primary)] border border-[var(--kecp-gray-300)] rounded-lg hover:border-[var(--kecp-primary)] transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          열기
        </a>
      </div>

      {/* URL 입력 */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-[var(--kecp-gray-700)] mb-1">
            서버 URL
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--kecp-gray-400)]" />
              <input
                type="url"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                placeholder="http://localhost:3001"
                className="kecp-input pl-9 w-full"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={onTest}
              loading={testing}
            >
              연결 테스트
            </Button>
          </div>
          {testResult === 'success' && (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              연결 성공 (CORS 정책에 따라 실제 응답은 다를 수 있습니다)
            </p>
          )}
          {testResult === 'error' && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              연결 실패 — URL을 확인하거나 서비스가 실행 중인지 확인하세요
            </p>
          )}
        </div>

        {/* 기능 목록 */}
        <div className="pt-3 border-t border-[var(--kecp-gray-100)]">
          <p className="text-xs font-medium text-[var(--kecp-gray-500)] uppercase tracking-wide mb-2">지원 기능</p>
          <ul className="space-y-1.5">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[var(--kecp-gray-600)]">
                <span className={`w-1.5 h-1.5 rounded-full ${colors.featureDot}`} />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  )
}

/** 웹훅 URL 표시 */
function WebhookUrl({
  label,
  url,
  onCopy,
  description,
}: {
  label: string
  url: string
  onCopy: (text: string) => void
  description: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-[var(--kecp-gray-700)]">{label}</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-[var(--kecp-gray-100)] border border-[var(--kecp-gray-200)] rounded-lg text-sm font-mono text-[var(--kecp-gray-800)] truncate">
          {url}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-2 text-xs font-medium border border-[var(--kecp-gray-300)] rounded-lg hover:bg-[var(--kecp-gray-50)] transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              복사됨
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              복사
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-[var(--kecp-gray-500)]">{description}</p>
    </div>
  )
}
