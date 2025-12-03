import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          환영합니다!
        </h2>
        <p className="text-gray-600 mb-6">
          테니스 동아리 경기 스케줄을 자동으로 생성하고 관리하는 시스템입니다.
        </p>
        <div className="flex space-x-4">
          <Link
            to="/schedule/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            새 스케줄 만들기
          </Link>
          <Link
            to="/history"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            기록 보기
          </Link>
        </div>
      </div>

      {/* Quick Guide */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-xl font-semibold mb-2">1. 회원 관리</h3>
          <p className="text-gray-600 text-sm mb-4">
            동아리 회원을 등록하고 관리합니다.
          </p>
          <Link
            to="/members"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            회원 관리 →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2">2. 스케줄 생성</h3>
          <p className="text-gray-600 text-sm mb-4">
            참석자를 선택하고 자동으로 경기 스케줄을 생성합니다.
          </p>
          <Link
            to="/schedule/new"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            스케줄 생성 →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">3. 기록 조회</h3>
          <p className="text-gray-600 text-sm mb-4">
            과거 경기 기록을 조회하고 통계를 확인합니다.
          </p>
          <Link
            to="/history"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            기록 보기 →
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h3 className="text-2xl font-bold mb-6">주요 기능</h3>
        <ul className="space-y-3">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">6경기 복식 스케줄 자동 생성</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">제약조건 설정 (마지막 경기 제외, 파트너 지정)</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">게스트 참가자 추가</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">실시간 스케줄 수정</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span className="text-gray-700">과거 경기 기록 보관 및 조회</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
