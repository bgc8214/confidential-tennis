import LoadingMascot from '../components/LoadingMascot';

/**
 * 로딩 마스코트 컴포넌트 사용 예시
 *
 * 실제 사용 시에는 데이터 로딩 중일 때 조건부 렌더링으로 사용하세요.
 *
 * 예시:
 * if (loading) {
 *   return <LoadingMascot message="스케줄을 불러오는 중..." />;
 * }
 */
export default function LoadingExample() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-8">로딩 마스코트 사용 예시</h1>
          <p className="text-gray-600 mb-8">
            귀여운 마스코트와 함께하는 로딩 화면입니다.
            데이터를 불러오는 동안 사용자에게 즐거운 경험을 제공합니다.
          </p>
        </div>

        {/* 작은 크기 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Small Size</h2>
          <LoadingMascot size="sm" message="잠시만 기다려주세요..." />
        </div>

        {/* 중간 크기 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Medium Size (기본)</h2>
          <LoadingMascot message="스케줄을 생성하는 중..." />
        </div>

        {/* 큰 크기 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Large Size</h2>
          <LoadingMascot size="lg" message="회원 데이터를 불러오는 중..." />
        </div>

        {/* 사용 코드 예시 */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-8 text-white">
          <h2 className="text-xl font-bold mb-4">사용 방법</h2>
          <pre className="text-sm overflow-x-auto">
{`// 데이터 로딩 중일 때
if (loading) {
  return <LoadingMascot message="데이터를 불러오는 중..." />;
}

// 크기 변경
<LoadingMascot size="sm" message="처리 중..." />
<LoadingMascot size="md" message="로딩 중..." /> // 기본값
<LoadingMascot size="lg" message="잠시만 기다려주세요..." />

// 메시지만 변경
<LoadingMascot message="스케줄을 생성하는 중..." />
<LoadingMascot message="회원 정보를 저장하는 중..." />
<LoadingMascot message="경기를 배정하는 중..." />`}
          </pre>
        </div>
      </div>
    </div>
  );
}
