import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleService } from '../services/scheduleService';
import { useClub } from '../contexts/ClubContext';
import { updateExpiredSchedules, updatePastSchedules } from '../utils/scheduleStatusUpdater';
import type { Schedule } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Calendar, Clock, Users, ChevronRight, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { useConfirm } from '../hooks/useConfirm';

type StatusFilter = 'all' | 'planned' | 'in_progress' | 'completed' | 'cancelled';

export default function ScheduleList() {
  const navigate = useNavigate();
  const { currentClub } = useClub();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (currentClub) {
      loadSchedules();
    }
  }, [selectedYear, selectedMonth, currentClub]);

  const loadSchedules = async () => {
    if (!currentClub) return;

    try {
      setLoading(true);

      // 스케줄 상태 자동 업데이트 (백그라운드)
      updateExpiredSchedules(currentClub.id).catch(console.error);
      updatePastSchedules(currentClub.id).catch(console.error);

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

  const handleDelete = async (scheduleId: number, date: string) => {
    const confirmed = await confirm({
      title: '스케줄 삭제',
      description: `${date} 스케줄을 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      confirmVariant: 'destructive',
      icon: <Trash2 className="w-6 h-6 text-red-600" />
    });

    if (!confirmed) return;

    try {
      await scheduleService.delete(scheduleId);
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

  const handleViewSchedule = async (schedule: Schedule) => {
    try {
      const matches = await scheduleService.getMatches(schedule.id);

      if (matches.length > 0) {
        navigate(`/schedule/${schedule.id}/detail`);
      } else {
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

  const filteredSchedules = schedules.filter(schedule =>
    statusFilter === 'all' || schedule.status === statusFilter
  );

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - 1 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const statusFilters: { value: StatusFilter; label: string; emoji: string }[] = [
    { value: 'all', label: '전체', emoji: '📋' },
    { value: 'planned', label: '예정', emoji: '📅' },
    { value: 'in_progress', label: '진행중', emoji: '▶️' },
    { value: 'completed', label: '완료', emoji: '✅' },
    { value: 'cancelled', label: '취소', emoji: '❌' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">스케줄 관리</h2>
          <p className="text-gray-600">
            모든 스케줄을 조회하고 관리할 수 있습니다.
          </p>
        </div>
        <Button
          onClick={() => navigate('/schedule/new')}
          className="bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          새 스케줄 만들기
        </Button>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-2 gap-4 animate-scale-in">
        {/* Date Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              기간 선택
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D4765A] transition-colors"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D4765A] transition-colors"
              >
                {months.map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Status Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              상태 필터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusFilters.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === filter.value
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-1">{filter.emoji}</span>
                  {filter.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50 animate-slide-in">
          <CardContent className="py-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Schedule List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#2E7D4E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Card className="animate-scale-in stagger-2">
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 text-lg mb-4">
              {statusFilter === 'all'
                ? '이번 달 스케줄이 없습니다.'
                : `${statusFilters.find(f => f.value === statusFilter)?.label} 상태의 스케줄이 없습니다.`
              }
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
        <div className="grid gap-4 animate-scale-in stagger-2">
          {filteredSchedules.map((schedule, index) => {
            const status = formatStatus(schedule.status);
            return (
              <Card
                key={schedule.id}
                className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-[#D4765A]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl flex items-center gap-3">
                        <span className="text-3xl">🎾</span>
                        {formatDate(schedule.date)}
                      </CardTitle>
                      <CardDescription className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {schedule.start_time} - {schedule.end_time}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.className}`}>
                          {status.label}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                          <span>{formatMatchType(schedule.match_type).emoji}</span>
                          <span>{formatMatchType(schedule.match_type).label}</span>
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">경기 수:</span>
                        <span>{schedule.total_matches || 6}경기</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">코트:</span>
                        <span>{schedule.court_count || 2}코트</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(schedule.id, formatDate(schedule.date));
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleViewSchedule(schedule)}
                        className="bg-emerald-600 text-white"
                      >
                        상세보기
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
}
