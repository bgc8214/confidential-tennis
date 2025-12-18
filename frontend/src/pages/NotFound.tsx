import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 마스코트 이미지 */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* 테니스 코트 배경 효과 */}
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>

            {/* 마스코트 */}
            <div className="relative w-64 h-64 rounded-full overflow-hidden shadow-2xl ring-4 ring-emerald-500/20 animate-bounce-gentle">
              <img
                src={`${import.meta.env.BASE_URL}seolha.png`}
                alt="길을 잃은 마스코트"
                className="w-full h-full object-cover"
              />
            </div>

            {/* 떠다니는 테니스공들 */}
            <div className="absolute -top-4 -right-4 animate-bounce">
              <span className="text-6xl">🎾</span>
            </div>
            <div className="absolute -bottom-4 -left-4 animate-bounce" style={{ animationDelay: '0.2s' }}>
              <span className="text-5xl">🎾</span>
            </div>
            <div className="absolute top-1/2 -left-8 animate-bounce" style={{ animationDelay: '0.4s' }}>
              <span className="text-4xl">🎾</span>
            </div>
          </div>
        </div>

        {/* 404 텍스트 */}
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-gray-800 mb-4 animate-slide-up">404</h1>
          <h2 className="text-3xl font-bold text-gray-700 mb-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            앗! 코트를 벗어났어요
          </h2>
          <p className="text-lg text-gray-600 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            찾으시는 페이지가 존재하지 않습니다.<br />
            아마도 테니스공이 코트 밖으로 나간 것 같아요!
          </p>
        </div>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Link to="/">
            <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Home className="w-5 h-5" />
              홈으로 돌아가기
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
            이전 페이지로
          </Button>
        </div>

        {/* 재미있는 메시지 */}
        <div className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-2xl shadow-lg animate-scale-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-gray-600 italic">
            💡 <strong>Tip:</strong> 혹시 스케줄을 찾고 계신가요? 상단 메뉴에서 스케줄 관리를 클릭해보세요!
          </p>
        </div>
      </div>
    </div>
  );
}
