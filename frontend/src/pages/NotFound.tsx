import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

/**
 * 404 페이지
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="mt-4 text-xl text-gray-600">페이지를 찾을 수 없습니다</p>
      <p className="mt-2 text-gray-500">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <Home className="w-5 h-5 mr-2" />
        홈으로 돌아가기
      </Link>
    </div>
  )
}
