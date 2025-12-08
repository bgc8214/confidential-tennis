import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { KakaoInAppBrowserWarning, InAppBrowserWarning } from '../components/KakaoInAppBrowserWarning';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        // 회원가입 성공 시 로그인 페이지로
        setIsSignUp(false);
        setError(null);
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
      } else {
        await signIn(email, password);
        // 로그인 성공 시 홈으로
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2E7D4E] to-[#D4765A] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#D4765A] to-[#2E7D4E] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎾</span>
          </div>
          <CardTitle className="text-2xl">
            {isSignUp ? '회원가입' : '로그인'}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? '새 계정을 만들어 시작하세요'
              : '테니스 동아리 스케줄 관리 시스템'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 카카오톡 인앱 브라우저 경고 */}
          <KakaoInAppBrowserWarning />
          <InAppBrowserWarning />

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">이름</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="홍길동"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#D4765A] to-[#2E7D4E] hover:from-[#B85C3D] hover:to-[#1F5A35]"
              disabled={loading}
            >
              {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
            </Button>

            {/* 구분선 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* 구글 로그인 버튼 */}
            <Button
              type="button"
              onClick={async () => {
                try {
                  setGoogleLoading(true);
                  setError(null);
                  await signInWithGoogle();
                } catch (err: any) {
                  setError(err.message || '구글 로그인에 실패했습니다.');
                  setGoogleLoading(false);
                }
              }}
              disabled={googleLoading || loading}
              variant="outline"
              className="w-full border-2 border-gray-300 hover:bg-gray-50"
            >
              {googleLoading ? (
                '처리 중...'
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  구글로 {isSignUp ? '회원가입' : '로그인'}
                </>
              )}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-[#2E7D4E] hover:underline"
              >
                {isSignUp
                  ? '이미 계정이 있으신가요? 로그인'
                  : '계정이 없으신가요? 회원가입'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

