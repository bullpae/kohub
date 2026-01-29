import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider as OIDCAuthProvider } from 'react-oidc-context'
import App from './App'
import { oidcConfig, isSSOEnabled } from './auth/oidcConfig'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
})

/**
 * OIDC 로그인 콜백 처리
 */
const onSigninCallback = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

const root = createRoot(document.getElementById('root')!)

if (isSSOEnabled()) {
  // SSO 활성화: Keycloak OIDC 사용
  root.render(
    <StrictMode>
      <OIDCAuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </OIDCAuthProvider>
    </StrictMode>
  )
} else {
  // SSO 비활성화: 개발용 Mock 인증
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>
  )
}
