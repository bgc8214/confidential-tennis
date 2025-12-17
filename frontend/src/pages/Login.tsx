import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { KakaoInAppBrowserWarning, InAppBrowserWarning } from '../components/KakaoInAppBrowserWarning';
import { Sparkles, TrendingUp, Zap } from 'lucide-react';

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
        setIsSignUp(false);
        setError(null);
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-500 to-orange-500 opacity-90"></div>

      {/* Animated Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float animation-delay-4000"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 51px),
          repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 51px)
        `
      }}></div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo & Brand */}
        <div className="text-center mb-8 animate-scale-in">
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6 relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-white rounded-3xl blur-2xl opacity-40 animate-glow"></div>
            <div className="relative w-full h-full bg-gradient-to-br from-orange-400 to-emerald-500 rounded-3xl flex items-center justify-center transform rotate-6 hover:rotate-12 transition-transform duration-300">
              <span className="text-5xl">🎾</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
            Court<span className="text-orange-300">Planner</span>
          </h1>
          <p className="text-white/80 text-lg font-medium">스마트한 경기 스케줄 관리</p>
        </div>

        {/* Glass Card */}
        <div className="glass-card rounded-3xl p-8 shadow-glass-lg animate-slide-up animation-delay-100">
          {/* Warnings */}
          <div className="mb-6">
            <KakaoInAppBrowserWarning />
            <InAppBrowserWarning />
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-8 p-1 bg-white/10 rounded-2xl">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                !isSignUp
                  ? 'bg-white text-emerald-600 shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                isSignUp
                  ? 'bg-white text-emerald-600 shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2 animate-slide-down">
                <Label htmlFor="fullName" className="text-white font-medium">
                  이름
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="홍길동"
                  className="bg-white/90 border-0 h-12 rounded-xl text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white backdrop-blur-sm"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="bg-white/90 border-0 h-12 rounded-xl text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white backdrop-blur-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••"
                className="bg-white/90 border-0 h-12 rounded-xl text-gray-900 placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-white backdrop-blur-sm"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 text-white px-4 py-3 rounded-xl text-sm animate-slide-down">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-orange-400 to-emerald-500 hover:from-orange-500 hover:to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] btn-hover-lift border-0"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  처리 중...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  {isSignUp ? '계정 만들기' : '시작하기'}
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-transparent text-white/60 font-medium">또는</span>
              </div>
            </div>

            {/* Google Login */}
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
              className="w-full h-14 bg-white/90 hover:bg-white border-0 text-gray-800 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm"
            >
              {googleLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                  처리 중...
                </div>
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
                  구글로 {isSignUp ? '시작하기' : '로그인'}
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 animate-slide-up animation-delay-200">
          {[
            { icon: Sparkles, text: '자동 배정' },
            { icon: TrendingUp, text: '통계 분석' },
            { icon: Zap, text: '빠른 공유' },
          ].map((feature, i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-4 text-center hover:scale-105 transition-transform duration-300"
            >
              <feature.icon className="w-6 h-6 mx-auto mb-2 text-white" />
              <p className="text-white/90 text-sm font-medium">{feature.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
