import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleService } from '../services/scheduleService';
import { useClub } from '../contexts/ClubContext';
import type { Schedule } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trash2, Link as LinkIcon, Edit } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useConfirm } from '../hooks/useConfirm';

export default function ScheduleHistory() {
  const navigate = useNavigate();
  const { currentClub } = useClub();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    if (currentClub) {
      loadSchedules();
    }
  }, [selectedYear, selectedMonth, currentClub]);

  const loadSchedules = async () => {
    if (!currentClub) return;
    
    try {
      setLoading(true);
      const data = await scheduleService.getByMonth(currentClub.id, selectedYear, selectedMonth);
      setSchedules(data);
      setError(null);
    } catch (err) {
      setError('스케줄 목록을 불러오는데 실패했습니다.');
      console.error(err);
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
    return `${month}월 ${day}일 (${dayOfWeek})`;
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

  const formatMatchType = (matchType: string) => {
    const typeMap: Record<string, { label: string; emoji: string }> = {
      mixed: { label: '혼복', emoji: '👨👩' },
      mens: { label: '남복', emoji: '👨👨' },
      womens: { label: '여복', emoji: '👩👩' }
    };
    return typeMap[matchType] || { label: matchType, emoji: '🎾' };
  };

  const handleViewSchedule = async (schedule: Schedule, e?: React.MouseEvent) => {
    // 삭제 버튼이나 다른 버튼 클릭 시에는 동작하지 않도록
    if (e && (e.target as HTMLElement).closest('button')) {
      return;
    }

    try {
      // 해당 스케줄의 경기 데이터 확인
      const matches = await scheduleService.getMatches(schedule.id);

      if (matches.length > 0) {
        // 경기가 있으면 상세 페이지로 이동
        navigate(`/schedule/${schedule.id}/detail`);
      } else {
        // 경기가 없으면 생성 페이지로 이동
        navigate(`/schedule/${schedule.id}/generate`);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: '불러오기 실패',
        description: '스케줄을 불러오는데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (schedule: Schedule, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    const confirmed = await confirm({
      title: '스케줄 삭제',
      description: `${formatDate(schedule.date)} 스케줄을 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      confirmVariant: 'destructive',
      icon: <Trash2 className="w-6 h-6 text-red-600" />
    });

    if (!confirmed) return;

    try {
      await scheduleService.delete(schedule.id);
      toast({
        title: '삭제 완료',
        description: '스케줄이 성공적으로 삭제되었습니다.',
      });
      loadSchedules();
    } catch (err) {
      console.error(err);
      toast({
        title: '삭제 실패',
        description: '스케줄 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleGeneratePublicLink = async (schedule: Schedule, e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    try {
      const publicLink = await scheduleService.generatePublicLink(schedule.id);
      const publicUrl = `${window.location.origin}/public/schedule/${publicLink}`;
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: '링크 생성 완료',
        description: '공개 링크가 생성되고 클립보드에 복사되었습니다.',
      });
      loadSchedules(); // 목록 새로고침
    } catch (err) {
      console.error(err);
      toast({
        title: '링크 생성 실패',
        description: '공개 링크 생성에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">경기 기록</h2>
        <p className="text-gray-600">
          과거 경기 스케줄을 조회하고 상세 정보를 확인할 수 있습니다.
        </p>
      </div>

      {/* Month Selector */}
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">📅</span>
            <span>조회 기간</span>
          </CardTitle>
          <CardDescription>
            년도와 월을 선택하여 해당 기간의 경기 기록을 확인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                년도
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D4765A] transition-colors"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                월
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D4765A] transition-colors"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="w-12 h-12 border-4 border-[#D4765A]/30 border-t-[#D4765A] rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">로딩 중...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl animate-slide-in">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Schedule List */}
      {!loading && !error && (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <Card className="animate-fade-in">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="text-6xl mb-4">🎾</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  경기 기록이 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  {selectedYear}년 {selectedMonth}월에 생성된 스케줄이 없습니다.
                </p>
                <Button
                  onClick={() => navigate('/schedule/new')}
                  className="bg-emerald-600 hover:shadow-lg"
                >
                  새 스케줄 만들기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule, idx) => {
                const status = formatStatus(schedule.status);
                return (
                  <Card
                    key={schedule.id}
                    className={`cursor-pointer hover:shadow-lg hover:border-[#D4765A]/30 transition-all duration-300 animate-fade-in stagger-${Math.min(idx + 1, 5)}`}
                    onClick={(e) => handleViewSchedule(schedule, e)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg">
                            <div className="text-xs font-medium">
                              {new Date(schedule.date).getMonth() + 1}월
                            </div>
                            <div className="text-2xl font-bold">
                              {new Date(schedule.date).getDate()}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                              {formatDate(schedule.date)}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {schedule.start_time} - {schedule.end_time}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-3 py-1 rounded-lg font-medium text-xs ${status.className}`}>
                                {status.label}
                              </span>
                              <span className="px-3 py-1 rounded-lg font-medium text-xs bg-purple-100 text-purple-700 flex items-center gap-1">
                                <span>{formatMatchType(schedule.match_type).emoji}</span>
                                <span>{formatMatchType(schedule.match_type).label}</span>
                              </span>
                              {schedule.public_link && (
                                <span className="px-3 py-1 rounded-lg font-medium text-xs bg-green-100 text-green-700 flex items-center gap-1">
                                  <LinkIcon className="w-3 h-3" />
                                  공개
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {/* 공개 링크 생성 버튼 */}
                          {!schedule.public_link && (
                            <Button
                              onClick={(e) => handleGeneratePublicLink(schedule, e)}
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                              title="공개 링크 생성"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                          )}
                          {/* 공개 링크가 있으면 복사 버튼 */}
                          {schedule.public_link && (
                            <Button
                              onClick={async (e) => {
                                e.stopPropagation();
                                const publicUrl = `${window.location.origin}/public/schedule/${schedule.public_link}`;
                                await navigator.clipboard.writeText(publicUrl);
                                toast({
                                  title: '복사 완료',
                                  description: '공개 링크가 클립보드에 복사되었습니다.',
                                });
                              }}
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 border-green-300 text-green-700 hover:bg-green-50"
                              title="공개 링크 복사"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                          )}
                          {/* 삭제 버튼 */}
                          <Button
                            onClick={(e) => handleDelete(schedule, e)}
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 border-red-300 text-red-700 hover:bg-red-50"
                            title="스케줄 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          {/* 상세보기 화살표 */}
                          <svg
                            className="w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Stats Summary */}
      {!loading && schedules.length > 0 && (
        <Card className="animate-scale-in bg-gradient-to-br from-[#F4CE6A]/20 to-[#D4765A]/10">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900">
                  {schedules.length}
                </div>
                <div className="text-sm text-gray-600">총 경기 수</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {schedules.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">완료</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {schedules.filter(s => s.status === 'planned').length}
                </div>
                <div className="text-sm text-gray-600">예정</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <ConfirmDialog />
    </div>
  );
}
