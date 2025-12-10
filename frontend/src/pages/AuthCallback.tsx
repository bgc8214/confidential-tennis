import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // OAuth 콜백 처리
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('인증 처리 실패:', error);
          navigate('/login?error=auth_failed');
          return;
        }

        if (data.session) {
          // 로그인 성공 - 홈으로 리다이렉트
          navigate('/');
        } else {
          // 세션이 없으면 로그인 페이지로
          navigate('/login');
        }
      } catch (err) {
        console.error('인증 콜백 처리 중 오류:', err);
        navigate('/login?error=callback_error');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2E7D4E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">인증 처리 중...</p>
      </div>
    </div>
  );
}



