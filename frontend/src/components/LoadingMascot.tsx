interface LoadingMascotProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingMascot({
  message = '로딩 중...',
  size = 'md'
}: LoadingMascotProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="relative">
        {/* 회전하는 테니스공 링 */}
        <div className={`${sizeClasses[size]} relative animate-spin-slow`}>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-emerald-400"></div>
        </div>

        {/* 중앙 마스코트 이미지 */}
        <div className={`absolute inset-0 flex items-center justify-center ${sizeClasses[size]}`}>
          <div className="w-[85%] h-[85%] rounded-full overflow-hidden shadow-lg animate-bounce-gentle">
            <img
              src="/seolha.png"
              alt="로딩 중"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 테니스공 아이콘들 */}
        <div className="absolute -top-2 -right-2 animate-bounce-delay-1">
          <span className="text-2xl">🎾</span>
        </div>
        <div className="absolute -bottom-2 -left-2 animate-bounce-delay-2">
          <span className="text-2xl">🎾</span>
        </div>
      </div>

      {/* 로딩 메시지 */}
      <div className="text-center">
        <p className="text-gray-700 font-medium animate-pulse">{message}</p>
        <div className="flex gap-1 justify-center mt-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></span>
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
        </div>
      </div>
    </div>
  );
}
