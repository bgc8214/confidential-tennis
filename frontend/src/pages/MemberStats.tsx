import { useState, useEffect } from 'react';
import { memberService } from '../services/memberService';
import { scheduleService } from '../services/scheduleService';
import { useClub } from '../contexts/ClubContext';
import type { Member } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

interface MemberStatistics {
  memberId: number;
  memberName: string;
  totalSchedules: number;
  attendanceCount: number;
  matchCount: number;
  attendanceRate: number;
}

export default function MemberStats() {
  const { currentClub } = useClub();
  const [members, setMembers] = useState<Member[]>([]);
  const [statistics, setStatistics] = useState<MemberStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (currentClub) {
      loadData();
    }
  }, [currentClub, selectedYear]);

  const loadData = async () => {
    if (!currentClub) return;

    try {
      setLoading(true);
      setError(null);

      // 최적화된 통계 조회 (한 번의 호출로 모든 데이터 가져오기)
      const result = await memberService.getClubStatistics(currentClub.id, selectedYear);

      // 회원 목록 설정 (이름만 필요하므로 별도로 가져오기)
      const membersData = await memberService.getAll(currentClub.id);
      setMembers(membersData);

      // 참석률 높은 순으로 정렬
      const sortedStats = result.members.sort((a, b) => b.attendanceRate - a.attendanceRate);
      setStatistics(sortedStats);
    } catch (err) {
      setError('통계 데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
    if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white';
    if (index === 2) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
    return 'bg-white border-2 border-gray-200';
  };

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i);

  if (!currentClub) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="text-6xl mb-4">🏢</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">클럽을 선택해주세요</h3>
        <p className="text-gray-600">통계를 보려면 먼저 클럽을 선택해야 합니다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-[#D4765A]/30 border-t-[#D4765A] rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">통계 데이터 분석 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">회원별 통계</h2>
        <p className="text-gray-600">
          회원들의 참석률과 경기 참여 통계를 확인할 수 있습니다.
        </p>
      </div>

      {/* Year Selector */}
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <span>조회 연도</span>
          </CardTitle>
          <CardDescription>통계를 확인할 연도를 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D4765A] transition-colors text-lg font-medium"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl animate-slide-in">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Overall Stats */}
      {statistics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-scale-in">
          <Card className="bg-gradient-to-br from-[#D4765A] to-[#B85C3D] text-white">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">👥</div>
              <div className="text-2xl sm:text-4xl font-bold">{members.length}</div>
              <div className="text-xs sm:text-sm text-white/80 whitespace-nowrap">총 회원 수</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#2E7D4E] to-[#1F5A35] text-white">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📅</div>
              <div className="text-2xl sm:text-4xl font-bold">
                {statistics[0]?.totalSchedules || 0}
              </div>
              <div className="text-xs sm:text-sm text-white/80 whitespace-nowrap">총 경기 수</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#4A9D6F] to-[#357A52] text-white">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📈</div>
              <div className="text-2xl sm:text-4xl font-bold">
                {statistics.length > 0
                  ? Math.round(
                      statistics.reduce((sum, s) => sum + s.attendanceRate, 0) /
                        statistics.length
                    )
                  : 0}
                %
              </div>
              <div className="text-xs sm:text-sm text-white/80 whitespace-nowrap">평균 참석률</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#F4CE6A] to-[#E0BA5B] text-gray-900">
            <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🏆</div>
              <div className="text-xl sm:text-4xl font-bold truncate">
                {statistics[0]?.memberName || '-'}
              </div>
              <div className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">최고 참석률</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistics List */}
      {statistics.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">통계 데이터가 없습니다</h3>
            <p className="text-gray-600">{selectedYear}년에 생성된 스케줄이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {statistics.map((stat, index) => (
            <Card
              key={stat.memberId}
              className={`transition-all duration-300 hover:shadow-xl animate-fade-in stagger-${Math.min(
                index + 1,
                5
              )} ${getRankColor(index)}`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {/* Rank */}
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold flex-shrink-0 ${
                        index < 3
                          ? 'bg-white/20'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {index < 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : index + 1}
                    </div>

                    {/* Name */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-xl font-bold truncate">{stat.memberName}</h3>
                      <p className={`text-xs sm:text-sm ${index < 3 ? 'text-white/80' : 'text-gray-500'}`}>
                        총 {stat.totalSchedules}회 중 {stat.attendanceCount}회 참석
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-8">
                    <div className="text-center">
                      <div
                        className={`text-2xl sm:text-3xl font-bold ${
                          index < 3 ? '' : getAttendanceRateColor(stat.attendanceRate)
                        }`}
                      >
                        {Math.round(stat.attendanceRate)}%
                      </div>
                      <div className={`text-xs whitespace-nowrap ${index < 3 ? 'text-white/70' : 'text-gray-500'}`}>
                        참석률
                      </div>
                    </div>

                    <div className="text-center">
                      <div className={`text-2xl sm:text-3xl font-bold ${index < 3 ? '' : 'text-gray-900'}`}>
                        {stat.matchCount}
                      </div>
                      <div className={`text-xs whitespace-nowrap ${index < 3 ? 'text-white/70' : 'text-gray-500'}`}>
                        경기 수
                      </div>
                    </div>

                    {/* Progress Bar - 모바일에서 숨김 */}
                    <div className="hidden sm:block w-32">
                      <div
                        className={`h-3 rounded-full overflow-hidden ${
                          index < 3 ? 'bg-white/20' : 'bg-gray-200'
                        }`}
                      >
                        <div
                          className={`h-full transition-all duration-500 ${
                            index < 3
                              ? 'bg-white'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${stat.attendanceRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
