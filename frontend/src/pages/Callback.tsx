import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * SSO 콜백 페이지
 * Keycloak 로그인 후 리다이렉트 되는 페이지
 */
export default function Callback() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      navigate('/');
    }
    if (!auth.isLoading && auth.error) {
      console.error('SSO error:', auth.error);
      navigate('/');
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}
