import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ClubProvider } from './contexts/ClubContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// 환경 변수 확인
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const kakaoApiKey = import.meta.env.VITE_KAKAO_API_KEY;

// 카카오 SDK 초기화
if (kakaoApiKey && typeof window !== 'undefined' && window.Kakao) {
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(kakaoApiKey);
    console.log('Kakao SDK initialized');
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  const root = document.getElementById('root')!;
  root.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; padding: 20px;">
      <div style="max-width: 500px; background: white; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 16px;">환경 변수 설정 필요</h1>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Supabase 환경 변수가 설정되지 않았습니다.<br/>
          .env 파일에 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정해주세요.
        </p>
        <pre style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: left; font-size: 12px; overflow-x: auto;">
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
        </pre>
      </div>
    </div>
  `;
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <ClubProvider>
            <App />
          </ClubProvider>
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}
