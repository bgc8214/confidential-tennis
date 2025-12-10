import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import html2canvas from 'html2canvas';
import { scheduleService } from '../services/scheduleService';
import { generateSchedule, convertMatchesToDbFormat } from '../utils/scheduleGenerator';
import type { Attendance, GeneratedMatch } from '../types';
import DraggableMatchCard from '../components/DraggableMatchCard';
import CompactScheduleView from '../components/CompactScheduleView';
import { useClub } from '../contexts/ClubContext';

export default function ScheduleGenerator() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { currentClub } = useClub();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [matches, setMatches] = useState<GeneratedMatch[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const compactViewRef = useRef<HTMLDivElement>(null);

  // @dnd-kit 센서 설정 (React 18과 호환)
  // 모바일 터치 지원: distance를 작게 설정하여 터치 반응성 향상
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5, // 모바일에서 더 빠른 반응을 위해 5px로 조정
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

  useEffect(() => {
    if (scheduleId) {
      loadScheduleData();
    }
  }, [scheduleId]);

  const loadScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);
      const id = parseInt(scheduleId!);

      if (isNaN(id)) {
        throw new Error('유효하지 않은 스케줄 ID입니다.');
      }

      // 스케줄 정보, 참석자 데이터 및 제약조건 불러오기
      const [scheduleData, attendanceData, constraintsData] = await Promise.all([
        scheduleService.getById(id),
        scheduleService.getAttendances(id),
        scheduleService.getConstraints(id)
      ]);

      if (!scheduleData) {
        throw new Error('스케줄을 찾을 수 없습니다.');
      }

      setSchedule(scheduleData);
      setPublicLink(scheduleData.public_link || null);

      console.log('스케줄 데이터:', scheduleData);
      console.log('참석자 데이터:', attendanceData);
      console.log('제약조건 데이터:', constraintsData);

      if (!attendanceData || attendanceData.length === 0) {
        throw new Error('참석자 데이터가 없습니다. 먼저 참석자를 선택해주세요.');
      }

      if (attendanceData.length < 4) {
        throw new Error(`참석자가 ${attendanceData.length}명입니다. 최소 4명 이상 필요합니다.`);
      }

      setAttendances(attendanceData);

      // 제약조건을 알고리즘에 전달 (스케줄의 경기 설정 사용)
      // 경기별 타입 배열 생성 (DB에서 가져오거나 기본값 사용)
      let matchTypes: ('mixed' | 'mens' | 'womens')[] = [];
      if (scheduleData.match_types && Array.isArray(scheduleData.match_types)) {
        matchTypes = scheduleData.match_types;
      } else {
        matchTypes = Array(scheduleData.total_matches || 6).fill(scheduleData.match_type || 'mixed');
      }
      
      // 코트별 타입 배열 생성 (선택사항)
      let courtTypes: ('mixed' | 'mens' | 'womens')[] | ('mixed' | 'mens' | 'womens')[][] | undefined = undefined;
      if (scheduleData.court_types && Array.isArray(scheduleData.court_types)) {
        courtTypes = scheduleData.court_types;
      }
      
      const generatedMatches = generateSchedule({
        attendees: attendanceData,
        constraints: constraintsData,
        startTime: scheduleData.start_time || '10:00',
        totalMatches: scheduleData.total_matches || 6,
        matchDuration: scheduleData.match_duration || 30,
        courtCount: scheduleData.court_count || 2,
        matchTypes: matchTypes,
        courtTypes: courtTypes,
        matchType: scheduleData.match_type || 'mixed' // 하위 호환성
      });

      console.log('생성된 경기:', generatedMatches);

      if (!generatedMatches || generatedMatches.length === 0) {
        throw new Error('경기를 생성할 수 없습니다. 참석자 수를 확인해주세요.');
      }

      setMatches(generatedMatches);
      setError(null);
    } catch (err: any) {
      const errorMessage = err?.message || '스케줄 데이터를 불러오는데 실패했습니다.';
      setError(errorMessage);
      console.error('스케줄 로딩 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Player swapping logic
    const activeId = String(active.id);
    const overId = String(over.id);

    // Parse IDs: format is "match-{matchIdx}-{court}-player-{playerIdx}"
    const parseId = (id: string) => {
      const parts = id.split('-');
      return {
        matchIdx: parseInt(parts[1]),
        court: parts[2] as 'A' | 'B',
        playerIdx: parseInt(parts[4])
      };
    };

    const activeData = parseId(activeId);
    const overData = parseId(overId);

    setMatches(prevMatches => {
      const newMatches = [...prevMatches];

      const activeMatch = newMatches.find(
        m => m.match_number === activeData.matchIdx + 1 && m.court === activeData.court
      );
      const overMatch = newMatches.find(
        m => m.match_number === overData.matchIdx + 1 && m.court === overData.court
      );

      if (!activeMatch || !overMatch) return prevMatches;

      // Get players
      const activePlayer = activeData.playerIdx < 2
        ? activeMatch.team1[activeData.playerIdx]
        : activeMatch.team2[activeData.playerIdx - 2];

      const overPlayer = overData.playerIdx < 2
        ? overMatch.team1[overData.playerIdx]
        : overMatch.team2[overData.playerIdx - 2];

      // Swap players
      if (activeData.playerIdx < 2) {
        activeMatch.team1[activeData.playerIdx] = overPlayer;
      } else {
        activeMatch.team2[activeData.playerIdx - 2] = overPlayer;
      }

      if (overData.playerIdx < 2) {
        overMatch.team1[overData.playerIdx] = activePlayer;
      } else {
        overMatch.team2[overData.playerIdx - 2] = activePlayer;
      }

      return newMatches;
    });
  };

  const handleDownloadImage = async () => {
    if (!compactViewRef.current) return;

    try {
      // CompactScheduleView를 이미지로 변환
      const canvas = await html2canvas(compactViewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        windowWidth: 1200,
        windowHeight: 800,
      });

      const link = document.createElement('a');
      const dateStr = schedule?.date ? new Date(schedule.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      link.download = `테니스-스케줄-${dateStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('이미지 다운로드 실패:', err);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  const handleRegenerate = async () => {
    try {
      const id = parseInt(scheduleId!);
      const constraintsData = await scheduleService.getConstraints(id);

      // 경기별 타입 배열 생성
      let matchTypes: ('mixed' | 'mens' | 'womens')[] = [];
      if (schedule?.match_types && Array.isArray(schedule.match_types)) {
        matchTypes = schedule.match_types;
      } else {
        matchTypes = Array(schedule?.total_matches || 6).fill(schedule?.match_type || 'mixed');
      }

      // 코트별 타입 배열 생성 (선택사항)
      let courtTypes: ('mixed' | 'mens' | 'womens')[] | undefined = undefined;
      if (schedule?.court_types && Array.isArray(schedule.court_types)) {
        courtTypes = schedule.court_types;
      }

      const regeneratedMatches = generateSchedule({
        attendees: attendances, // attendances 상태 사용
        constraints: constraintsData,
        startTime: schedule?.start_time || '10:00',
        totalMatches: schedule?.total_matches || 6,
        matchDuration: schedule?.match_duration || 30,
        courtCount: schedule?.court_count || 2,
        matchTypes: matchTypes,
        courtTypes: courtTypes,
        matchType: schedule?.match_type || 'mixed'
      });
      setMatches(regeneratedMatches);
      setError(null);
    } catch (err) {
      setError('스케줄 재생성에 실패했습니다.');
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const id = parseInt(scheduleId!);

      const dbMatches = convertMatchesToDbFormat(matches, id);
      await scheduleService.addMatches(dbMatches);

      alert('스케줄이 저장되었습니다!');
      navigate('/');
    } catch (err) {
      setError('스케줄 저장에 실패했습니다.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async () => {
    // 사용자에게 선택 옵션 제공
    const deleteSchedule = window.confirm(
      '이전 단계로 돌아가시겠습니까?\n\n확인: 설정을 수정하고 다시 생성\n취소: 홈으로 돌아가기'
    );

    if (deleteSchedule) {
      // 이전 단계(스케줄 생성 페이지)로 돌아가기
      // scheduleId를 포함하여 수정 모드로 돌아감
      navigate(`/schedule/${scheduleId}/edit`);
    } else {
      // 홈으로 이동
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col justify-center items-center min-h-[60vh] space-y-4 py-12">
        <div className="w-12 h-12 border-4 border-[#D4765A]/30 border-t-[#D4765A] rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium text-lg">스케줄 생성 중...</p>
        <p className="text-sm text-gray-500">참석자 데이터를 불러오는 중입니다.</p>
        <p className="text-xs text-gray-400 mt-2">스케줄 ID: {scheduleId}</p>
      </div>
    );
  }

  if (error && !matches.length) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-12">
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-6 rounded-2xl">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">오류가 발생했습니다</h3>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/schedule/new')}
            className="px-6 py-3 bg-gradient-to-r from-[#D4765A] to-[#2E7D4E] text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            새 스케줄 만들기
          </button>
          <button
            onClick={() => loadScheduleData()}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!matches.length && !loading && !error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-12">
        <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-6 py-6 rounded-2xl">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">경기 데이터가 없습니다</h3>
              <p className="font-medium">참석자 데이터가 없거나 경기를 생성할 수 없습니다.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/schedule/new')}
            className="px-6 py-3 bg-gradient-to-r from-[#D4765A] to-[#2E7D4E] text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            새 스케줄 만들기
          </button>
        </div>
      </div>
    );
  }

  const matchesByNumber = Array.from({ length: 6 }, (_, i) => i + 1).map(matchNum => ({
    matchNumber: matchNum,
    courtA: matches.find(m => m.match_number === matchNum && m.court === 'A'),
    courtB: matches.find(m => m.match_number === matchNum && m.court === 'B')
  }));

  // 디버깅용 로그
  console.log('렌더링 상태:', { 
    loading, 
    error, 
    matchesCount: matches.length, 
    attendancesCount: attendances.length,
    matchesByNumber 
  });

  return (
    <div className="w-full space-y-8 py-4" ref={scheduleRef}>
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
          <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">경기 스케줄</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 공개 링크 표시 또는 생성 버튼 */}
            {publicLink ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 rounded-lg border border-purple-200 shadow-sm">
                <span className="text-xs text-purple-700 font-medium">공개 링크:</span>
                <code className="text-xs text-purple-900 font-mono bg-white px-2 py-1 rounded border">{publicLink}</code>
                <button
                  onClick={async () => {
                    const publicUrl = `${window.location.origin}/public/schedule/${publicLink}`;
                    await navigator.clipboard.writeText(publicUrl);
                    alert('공개 링크가 복사되었습니다!');
                  }}
                  className="text-purple-600 hover:text-purple-800 p-1 hover:bg-purple-200 rounded transition-colors"
                  title="공개 링크 복사"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  if (!scheduleId) {
                    alert('스케줄 ID가 없습니다.');
                    return;
                  }
                  try {
                    const id = parseInt(scheduleId);
                    if (isNaN(id)) {
                      alert('유효하지 않은 스케줄 ID입니다.');
                      return;
                    }
                    const newPublicLink = await scheduleService.generatePublicLink(id);
                    setPublicLink(newPublicLink);
                    alert('공개 링크가 생성되었습니다!');
                  } catch (err) {
                    console.error('공개 링크 생성 실패:', err);
                    alert('공개 링크 생성에 실패했습니다.');
                  }
                }}
                className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors shadow-md flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                공개 링크 생성
              </button>
            )}

            <button
              onClick={handleDownloadImage}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2 text-xs sm:text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">이미지 저장</span>
              <span className="sm:hidden">저장</span>
            </button>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              ✓ 생성 완료
            </span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          선수를 드래그하여 팀을 변경할 수 있습니다. 확인 후 저장하거나 재생성하세요.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-6 py-4 rounded-2xl animate-slide-in">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 animate-scale-in">
        <div className="bg-gradient-to-br from-[#D4765A] to-[#B85C3D] text-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg">
          <div className="text-xl sm:text-3xl mb-1 sm:mb-2">👥</div>
          <div className="text-xl sm:text-3xl font-bold">{attendances.length}</div>
          <div className="text-xs sm:text-sm text-white/80">참석자</div>
        </div>
        <div className="bg-gradient-to-br from-[#2E7D4E] to-[#1F5A35] text-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg">
          <div className="text-xl sm:text-3xl mb-1 sm:mb-2">🎾</div>
          <div className="text-xl sm:text-3xl font-bold">6</div>
          <div className="text-xs sm:text-sm text-white/80">경기</div>
        </div>
        <div className="bg-gradient-to-br from-[#4A9D6F] to-[#357A52] text-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg">
          <div className="text-xl sm:text-3xl mb-1 sm:mb-2">🏟️</div>
          <div className="text-lg sm:text-3xl font-bold">A & B</div>
          <div className="text-xs sm:text-sm text-white/80">코트</div>
        </div>
      </div>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-8">
          {matchesByNumber.map(({ matchNumber, courtA, courtB }, idx) => {
            // Tailwind는 동적 클래스를 인식하지 않으므로 정적 클래스 사용
            const staggerClasses = [
              'stagger-1',
              'stagger-2', 
              'stagger-3',
              'stagger-4',
              'stagger-5'
            ];
            const staggerClass = idx < 5 ? staggerClasses[idx] : '';
            return (
            <div
              key={matchNumber}
              className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-8 border-2 border-gray-100 hover:border-[#D4765A]/20 transition-all duration-300 animate-fade-in ${staggerClass}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#D4765A] to-[#2E7D4E] rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                    {matchNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">경기 {matchNumber}</h3>
                      {courtA?.match_type && (
                        <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-lg font-medium text-xs sm:text-sm border-2 flex items-center gap-1 ${
                          courtA.match_type === 'mixed' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          courtA.match_type === 'mens' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-pink-100 text-pink-700 border-pink-200'
                        }`}>
                          <span>{courtA.match_type === 'mixed' ? '🎾' : courtA.match_type === 'mens' ? '👨‍🦱' : '👩‍🦱'}</span>
                          <span>{courtA.match_type === 'mixed' ? '혼복' : courtA.match_type === 'mens' ? '남복' : '여복'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">{courtA?.start_time || courtB?.start_time}</p>
                  </div>
                </div>
                <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#F4CE6A]/20 text-[#B85C3D] rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm self-start sm:self-auto">
                  30분
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {courtA && <DraggableMatchCard match={courtA} matchIndex={matchNumber - 1} />}
                {courtB && <DraggableMatchCard match={courtB} matchIndex={matchNumber - 1} />}
              </div>
            </div>
            );
          })}
        </div>
      </DndContext>

      {/* Player Statistics */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border-2 border-gray-100 animate-scale-in">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>📊</span>
          <span>참석자별 경기 통계</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(() => {
            // 각 참석자별 경기 통계 계산
            const playerStats = new Map<string, { mixed: number; mens: number; womens: number }>();

            matches.forEach(match => {
              const players = [...match.team1, ...match.team2];
              players.forEach(player => {
                if (player) {
                  const playerId = player.is_guest
                    ? `guest-${player.guest_name}`
                    : `member-${player.member_id}`;

                  if (!playerStats.has(playerId)) {
                    playerStats.set(playerId, { mixed: 0, mens: 0, womens: 0 });
                  }

                  const stats = playerStats.get(playerId)!;
                  if (match.match_type === 'mixed') stats.mixed++;
                  else if (match.match_type === 'mens') stats.mens++;
                  else if (match.match_type === 'womens') stats.womens++;
                }
              });
            });

            // 참석자 정보와 통계 매핑
            return attendances.map(attendance => {
              const playerId = attendance.is_guest
                ? `guest-${attendance.guest_name}`
                : `member-${attendance.member_id}`;
              const playerName = attendance.is_guest ? attendance.guest_name : attendance.member?.name;
              const stats = playerStats.get(playerId) || { mixed: 0, mens: 0, womens: 0 };
              const totalMatches = stats.mixed + stats.mens + stats.womens;

              return (
                <div key={playerId} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="font-semibold text-gray-900 mb-2">{playerName || '알 수 없음'}</div>
                  <div className="text-sm space-y-1">
                    <div className="text-gray-600">
                      총 <span className="font-bold text-gray-900">{totalMatches}</span>경기
                    </div>
                    {stats.mixed > 0 && (
                      <div className="text-purple-600">혼복 {stats.mixed}경기</div>
                    )}
                    {stats.mens > 0 && (
                      <div className="text-blue-600">남복 {stats.mens}경기</div>
                    )}
                    {stats.womens > 0 && (
                      <div className="text-pink-600">여복 {stats.womens}경기</div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-4 sm:bottom-6 z-10 animate-scale-in">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border-2 border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleRegenerate}
              disabled={isSaving}
              className="flex-1 min-w-0 sm:min-w-[140px] px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg sm:rounded-xl font-bold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>재생성</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] min-w-0 sm:min-w-[200px] px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-[#D4765A] to-[#2E7D4E] text-white rounded-lg sm:rounded-xl font-bold hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-105 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>저장하기</span>
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 min-w-0 sm:min-w-[140px] px-4 py-3 sm:px-6 sm:py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>이전</span>
            </button>
          </div>
        </div>
      </div>

      {/* 숨겨진 CompactScheduleView - 이미지 다운로드용 */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }} ref={compactViewRef}>
        {schedule && (
          <CompactScheduleView
            matches={matches}
            date={schedule.date}
            startTime={schedule.start_time}
            endTime={schedule.end_time}
            clubName={currentClub?.name}
          />
        )}
      </div>
    </div>
  );
}
