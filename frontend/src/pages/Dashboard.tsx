import { useQuery } from '@tanstack/react-query'
import { Server, TicketCheck, AlertTriangle, CheckCircle } from 'lucide-react'
import { api } from '../api/client'

/**
 * 대시보드 페이지
 */
export default function Dashboard() {
  // 헬스 체크 API 호출
  const { data: health, isLoading } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then(res => res.data),
  })

  const stats = [
    { name: '전체 호스트', value: '0', icon: Server, color: 'bg-blue-500' },
    { name: '활성 티켓', value: '0', icon: TicketCheck, color: 'bg-yellow-500' },
    { name: '장애 발생', value: '0', icon: AlertTriangle, color: 'bg-red-500' },
    { name: '정상 서버', value: '0', icon: CheckCircle, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-6">
      {/* 페이지 타이틀 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          MSP 운영 현황을 한눈에 확인하세요
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 백엔드 연결 상태 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">시스템 상태</h2>
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <>
              <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
              <span className="text-gray-500">연결 확인 중...</span>
            </>
          ) : health?.data?.status === 'UP' ? (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-green-700">Backend 연결됨</span>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-red-700">Backend 연결 실패</span>
            </>
          )}
        </div>
      </div>

      {/* 빠른 시작 가이드 */}
      <div className="bg-primary-50 rounded-lg border border-primary-200 p-6">
        <h2 className="text-lg font-semibold text-primary-900 mb-2">시작하기</h2>
        <p className="text-sm text-primary-700 mb-4">
          kohub를 사용하려면 다음 단계를 완료하세요:
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-primary-800">
          <li>호스트 메뉴에서 관리할 서버를 등록하세요</li>
          <li>Uptime Kuma에서 모니터를 설정하고 Webhook을 연결하세요</li>
          <li>Termix에서 SSH 연결 정보를 설정하세요</li>
          <li>장애 발생 시 티켓이 자동 생성되고 터미널로 빠르게 접속할 수 있습니다</li>
        </ol>
      </div>
    </div>
  )
}
