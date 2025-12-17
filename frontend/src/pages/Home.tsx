import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, BarChart3, ArrowRight, LogIn, Plus, Clock, CheckCircle2, Zap, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';
import { scheduleService } from '../services/scheduleService';
import { updateExpiredSchedules, updatePastSchedules } from '../utils/scheduleStatusUpdater';
import type { Schedule } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentClub } = useClub();
  const isLoggedIn = !!user;
  const hasClub = !!currentClub;

  const [recentSchedules, setRecentSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && hasClub && currentClub) {
      loadRecentSchedules();
    }
  }, [isLoggedIn, hasClub, currentClub]);

  const loadRecentSchedules = async () => {
    if (!currentClub) return;

    try {
      setLoading(true);

      // 스케줄 상태 자동 업데이트 (백그라운드)
      updateExpiredSchedules(currentClub.id).catch(console.error);
      updatePastSchedules(currentClub.id).catch(console.error);

      const now = new Date();
      const data = await scheduleService.getByMonth(currentClub.id, now.getFullYear(), now.getMonth() + 1);
      // 최근 3개만 표시
      setRecentSchedules(data.slice(0, 3));
    } catch (err) {
      console.error('Failed to load recent schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  };

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      planned: { label: '예정', className: 'bg-blue-100 text-blue-700' },
      in_progress: { label: '진행중', className: 'bg-yellow-100 text-yellow-700' },
      completed: { label: '완료', className: 'bg-green-100 text-green-700' },
      cancelled: { label: '취소', className: 'bg-red-100 text-red-700' }
    };
    return statusMap[status] || statusMap.planned;
  };

  // 로그인 전 - 서비스 소개 페이지
  if (!isLoggedIn || !hasClub) {
    return (
      <div className="w-full space-y-20">
        {/* Hero Section */}
        <section className="w-full">
          <div className="bg-emerald-600 rounded-3xl py-20 px-8 md:px-16 relative overflow-hidden text-center">
            <div className="relative z-10">
              <div className="text-6xl mb-6">🎾</div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                테니스 클럽<br />
                <span className="text-[#F4CE6A]">스케줄 자동 생성</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                참석자를 선택하면 <span className="font-bold text-[#F4CE6A]">공평한 경기 배정</span>을 자동으로 생성합니다.<br />
                더 이상 엑셀로 고민하지 마세요!
              </p>

              <div className="flex gap-4 justify-center items-center flex-wrap">
                {isLoggedIn ? (
                  <Button
                    size="lg"
                    onClick={() => navigate('/clubs')}
                    className="bg-white text-[#D4765A] hover:bg-white/90 text-lg px-10 py-7 h-auto font-bold shadow-xl"
                  >
                    클럽 선택하기
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => navigate('/login')}
                    className="bg-white text-[#D4765A] hover:bg-white/90 text-lg px-10 py-7 h-auto font-bold shadow-xl"
                  >
                    <LogIn className="mr-2 w-5 h-5" />
                    무료로 시작하기
                  </Button>
                )}
              </div>

              {/* 핵심 메트릭 */}
              <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">1-10</div>
                  <div className="text-sm text-white/80 mt-1">경기 수 자유</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">8-12</div>
                  <div className="text-sm text-white/80 mt-1">참석 인원</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">3초</div>
                  <div className="text-sm text-white/80 mt-1">스케줄 생성</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            왜 이 서비스를 사용해야 할까요?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4 pt-8">
                <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">3초 자동 배정</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  엑셀로 몇 시간씩 고민하지 마세요.<br />
                  참석자만 체크하면 공평한 경기를<br />
                  <span className="font-bold text-[#D4765A]">자동으로 생성</span>합니다.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4 pt-8">
                <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">공평한 분배</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  모든 참석자가 균등하게 경기에 참여하고<br />
                  연속 경기를 최소화하여<br />
                  <span className="font-bold text-[#2E7D4E]">충분한 휴식 시간</span>을 보장합니다.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4 pt-8">
                <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">간편한 공유</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  공개 링크를 카카오톡으로 공유하면<br />
                  회원가입 없이도 누구나<br />
                  <span className="font-bold text-[#F4CE6A]">스케줄을 확인</span>할 수 있습니다.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full bg-gray-50 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            이렇게 간단합니다
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4765A] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">회원 등록</h3>
              <p className="text-sm text-gray-600">동아리 회원들을<br />간단히 등록</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2E7D4E] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">참석자 선택</h3>
              <p className="text-sm text-gray-600">이번 주 참석자를<br />체크박스로 선택</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#D4765A] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">자동 생성</h3>
              <p className="text-sm text-gray-600">3초만에 공평한<br />경기 배정 완성</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2E7D4E] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="font-bold text-lg mb-2">링크 공유</h3>
              <p className="text-sm text-gray-600">카카오톡으로<br />간편하게 공유</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            지금 바로 시작하세요!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            무료로 사용 가능합니다. 회원가입만 하면 끝!
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/login')}
            className="bg-emerald-600 text-white text-lg px-12 py-7 h-auto font-bold shadow-xl hover:shadow-2xl"
          >
            <LogIn className="mr-2 w-5 h-5" />
            무료로 시작하기
          </Button>
        </section>
      </div>
    );
  }

  // 로그인 후 - 대시보드
  return (
    <div className="w-full space-y-8">
      {/* Welcome Section */}
      <div className="bg-emerald-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          안녕하세요, {currentClub?.name}! 🎾
        </h1>
        <p className="text-white/90 text-lg">
          오늘도 즐거운 테니스 하세요!
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#D4765A]"
          onClick={() => navigate('/schedule/new')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">새 스케줄</h3>
                <p className="text-sm text-gray-600">빠르게 생성하기</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#2E7D4E]"
          onClick={() => navigate('/schedules')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#2E7D4E] to-[#D4765A] rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">스케줄 관리</h3>
                <p className="text-sm text-gray-600">전체 목록 보기</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#F4CE6A]"
          onClick={() => navigate('/members')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F4CE6A] to-[#E0BA5B] rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h3 className="font-bold text-lg">회원 관리</h3>
                <p className="text-sm text-gray-600">등록 및 수정</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Schedules */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">최근 스케줄</h2>
          <Button
            variant="outline"
            onClick={() => navigate('/schedules')}
            className="text-[#D4765A] border-[#D4765A] hover:bg-[#D4765A] hover:text-white"
          >
            전체 보기
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[#2E7D4E] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : recentSchedules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg mb-4">
                아직 생성된 스케줄이 없습니다.
              </p>
              <Button
                onClick={() => navigate('/schedule/new')}
                className="bg-emerald-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                첫 스케줄 만들기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {recentSchedules.map((schedule) => {
              const status = formatStatus(schedule.status);
              return (
                <Card
                  key={schedule.id}
                  className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#D4765A]"
                  onClick={() => navigate(`/schedule/${schedule.id}/detail`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold">{formatDate(schedule.date)}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {schedule.start_time} - {schedule.end_time}
                          </span>
                          <span>{schedule.total_matches || 6}경기</span>
                          <span>{schedule.court_count || 2}코트</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#2E7D4E]" />
              회원 통계
            </CardTitle>
            <CardDescription>
              회원별 참석률과 경기 횟수를 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/stats')}
              variant="outline"
              className="w-full"
            >
              통계 보러가기
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-700" />
              공개 링크로 공유
            </CardTitle>
            <CardDescription>
              스케줄을 생성할 때 공개 링크를 활성화하면<br />
              회원가입 없이 누구나 조회 가능합니다
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
