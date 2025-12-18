import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { scheduleService } from '../services/scheduleService';
import { updateExpiredSchedules, updatePastSchedules } from '../utils/scheduleStatusUpdater';
import type { Schedule, Match, Attendance, GeneratedMatch } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Link as LinkIcon, Edit, Trash2, Download, Save, X } from 'lucide-react';
import CompactScheduleView from '../components/CompactScheduleView';
import DraggableMatchCard from '../components/DraggableMatchCard';
import { useClub } from '../contexts/ClubContext';
import { useToast } from '../hooks/use-toast';
import { useConfirm } from '../hooks/useConfirm';

export default function ScheduleDetail() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { currentClub } = useClub();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const compactViewRef = useRef<HTMLDivElement>(null);

  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedMatches, setEditedMatches] = useState<GeneratedMatch[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // @dnd-kit 센서 설정
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 5,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);

  useEffect(() => {
    if (scheduleId && currentClub) {
      loadScheduleDetail();
    }
  }, [scheduleId, currentClub]);

  const loadScheduleDetail = async () => {
    if (!currentClub) return;

    try {
      setLoading(true);
      const id = parseInt(scheduleId!);

      // 스케줄 상태 자동 업데이트 (백그라운드)
      updateExpiredSchedules(currentClub.id).catch(console.error);
      updatePastSchedules(currentClub.id).catch(console.error);

      // 스케줄 정보, 경기 목록, 참석자 목록을 병렬로 로드
      const [scheduleData, matchesData, attendancesData] = await Promise.all([
        scheduleService.getById(id),
        scheduleService.getMatches(id),
        scheduleService.getAttendances(id)
      ]);

      if (scheduleData) {
        setSchedule(scheduleData);
        setPublicLink(scheduleData.public_link || null);
      }

      setMatches(matchesData);
      setAttendances(attendancesData);
      setError(null);
    } catch (err) {
      setError('스케줄 상세 정보를 불러오는데 실패했습니다.');
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

  const getPlayerName = (attendance: Attendance | null | undefined): string => {
    if (!attendance) return '미배정';
    if (attendance.is_guest) {
      return attendance.guest_name || '게스트';
    }
    return attendance.member?.name || '알 수 없음';
  };

  const getPlayerLabel = (attendance: Attendance | null | undefined): string => {
    if (!attendance) return '';
    if (attendance.is_guest) return '게스트';
    const gender = attendance.member?.gender;
    switch (gender) {
      case 'male': return '남';
      case 'female': return '여';
      default: return '';
    }
  };

  const getPlayerLabelColor = (attendance: Attendance | null | undefined): string => {
    if (!attendance) return 'bg-gray-100 text-gray-600';
    if (attendance.is_guest) return 'bg-gray-200 text-gray-700';
    const gender = attendance.member?.gender;
    switch (gender) {
      case 'male': return 'bg-blue-100 text-blue-700';
      case 'female': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleDownloadImage = async () => {
    if (!compactViewRef.current || !schedule) return;

    try {
      const canvas = await html2canvas(compactViewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        windowWidth: 1200,
        windowHeight: 800,
      });

      const link = document.createElement('a');
      const dateStr = new Date(schedule.date).toISOString().split('T')[0];
      link.download = `테니스-스케줄-${dateStr}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({
        title: '이미지 저장 완료',
        description: '스케줄 이미지가 다운로드되었습니다.',
      });
    } catch (err) {
      console.error('이미지 다운로드 실패:', err);
      toast({
        title: '이미지 다운로드 실패',
        description: '이미지 다운로드에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  // 편집 모드 시작
  const handleStartEdit = () => {
    // 현재 matches를 GeneratedMatch 형식으로 변환
    const generatedMatches: GeneratedMatch[] = [];

    // 경기 번호별로 그룹화
    for (let matchNumber = 1; matchNumber <= 6; matchNumber++) {
      const courtAMatch = matches.find(m => m.match_number === matchNumber && m.court === 'A');
      const courtBMatch = matches.find(m => m.match_number === matchNumber && m.court === 'B');

      if (courtAMatch) {
        generatedMatches.push({
          match_number: courtAMatch.match_number,
          court: 'A',
          start_time: courtAMatch.start_time,
          match_type: courtAMatch.match_type,
          team1: [courtAMatch.player1, courtAMatch.player2].filter((p): p is Attendance => !!p) as [Attendance, Attendance],
          team2: [courtAMatch.player3, courtAMatch.player4].filter((p): p is Attendance => !!p) as [Attendance, Attendance],
        });
      }

      if (courtBMatch) {
        generatedMatches.push({
          match_number: courtBMatch.match_number,
          court: 'B',
          start_time: courtBMatch.start_time,
          match_type: courtBMatch.match_type,
          team1: [courtBMatch.player1, courtBMatch.player2].filter((p): p is Attendance => !!p) as [Attendance, Attendance],
          team2: [courtBMatch.player3, courtBMatch.player4].filter((p): p is Attendance => !!p) as [Attendance, Attendance],
        });
      }
    }

    setEditedMatches(generatedMatches);
    setIsEditMode(true);
  };

  // 편집 모드 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedMatches([]);
  };

  // 드래그 앤 드롭 처리
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Parse IDs: format is "match-{matchIdx}-{court}-player-{playerIdx}"
    const parseId = (id: string) => {
      const parts = id.split('-');
      return {
        matchIndex: parseInt(parts[1]),
        court: parts[2],
        playerIndex: parseInt(parts[4])
      };
    };

    const activeInfo = parseId(activeId);
    const overInfo = parseId(overId);

    setEditedMatches(prevMatches => {
      const newMatches = [...prevMatches];

      const activeMatch = newMatches[activeInfo.matchIndex];
      const overMatch = newMatches[overInfo.matchIndex];

      if (!activeMatch || !overMatch) return prevMatches;

      // Get players from teams
      const getPlayer = (match: GeneratedMatch, playerIdx: number) => {
        if (playerIdx < 2) return match.team1[playerIdx];
        return match.team2[playerIdx - 2];
      };

      const setPlayer = (match: GeneratedMatch, playerIdx: number, player: Attendance) => {
        const newMatch = { ...match };
        if (playerIdx < 2) {
          newMatch.team1 = [...match.team1];
          newMatch.team1[playerIdx] = player;
        } else {
          newMatch.team2 = [...match.team2];
          newMatch.team2[playerIdx - 2] = player;
        }
        return newMatch;
      };

      const activePlayer = getPlayer(activeMatch, activeInfo.playerIndex);
      const overPlayer = getPlayer(overMatch, overInfo.playerIndex);

      // Swap players
      newMatches[activeInfo.matchIndex] = setPlayer(activeMatch, activeInfo.playerIndex, overPlayer);
      newMatches[overInfo.matchIndex] = setPlayer(overMatch, overInfo.playerIndex, activePlayer);

      return newMatches;
    });
  };

  // 변경사항 저장
  const handleSaveEdit = async () => {
    if (!scheduleId) return;

    try {
      setIsSaving(true);

      // GeneratedMatch를 DB 형식으로 변환
      const dbMatches = editedMatches.map(match => ({
        schedule_id: parseInt(scheduleId),
        match_number: match.match_number,
        court: match.court,
        start_time: match.start_time,
        match_type: match.match_type,
        player1_id: match.team1[0]?.id,
        player2_id: match.team1[1]?.id,
        player3_id: match.team2[0]?.id,
        player4_id: match.team2[1]?.id,
      }));

      // 기존 경기 삭제 후 새로운 경기 저장
      await scheduleService.updateMatches(parseInt(scheduleId), dbMatches);

      toast({
        title: '수정 완료',
        description: '경기 수정이 완료되었습니다.',
      });
      setIsEditMode(false);

      // 데이터 새로고침
      await loadScheduleDetail();
    } catch (err) {
      console.error('경기 저장 실패:', err);
      toast({
        title: '저장 실패',
        description: '경기 저장에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-[#D4765A]/30 border-t-[#D4765A] rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">로딩 중...</p>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl">
          <p className="font-medium">{error || '스케줄을 찾을 수 없습니다.'}</p>
        </div>
        <Button onClick={() => navigate('/schedules')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          기록 목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const matchesByNumber = Array.from({ length: 6 }, (_, i) => i + 1).map(matchNum => ({
    matchNumber: matchNum,
    courtA: matches.find(m => m.match_number === matchNum && m.court === 'A'),
    courtB: matches.find(m => m.match_number === matchNum && m.court === 'B')
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-0">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <Button
            onClick={() => navigate('/schedules')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            기록 목록으로
          </Button>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {formatDate(schedule.date)}
          </h2>
          <p className="text-gray-600">
            {schedule.start_time} - {schedule.end_time}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-4 py-2 rounded-xl font-medium text-sm ${
            schedule.status === 'completed' ? 'bg-green-100 text-green-700' :
            schedule.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            schedule.status === 'cancelled' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {schedule.status === 'completed' ? '완료' :
             schedule.status === 'in_progress' ? '진행중' :
             schedule.status === 'cancelled' ? '취소' : '예정'}
          </span>
          
          {/* 공개 링크 생성/복사 버튼 */}
          {publicLink ? (
            <Button
              onClick={async () => {
                const publicUrl = `${window.location.origin}/public/schedule/${publicLink}`;
                await navigator.clipboard.writeText(publicUrl);
                toast({
                  title: '링크 복사 완료',
                  description: '공개 링크가 클립보드에 복사되었습니다.',
                });
              }}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              공개 링크 복사
            </Button>
          ) : (
            <Button
              onClick={async () => {
                if (!scheduleId) {
                  toast({
                    title: '오류',
                    description: '스케줄 ID가 없습니다.',
                    variant: 'destructive',
                  });
                  return;
                }
                try {
                  const id = parseInt(scheduleId);
                  if (isNaN(id) || id <= 0) {
                    toast({
                      title: '오류',
                      description: '유효하지 않은 스케줄 ID입니다.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  const newPublicLink = await scheduleService.generatePublicLink(id);
                  setPublicLink(newPublicLink);
                  const publicUrl = `${window.location.origin}/public/schedule/${newPublicLink}`;
                  await navigator.clipboard.writeText(publicUrl);
                  toast({
                    title: '링크 생성 완료',
                    description: '공개 링크가 생성되고 클립보드에 복사되었습니다.',
                  });
                } catch (err: any) {
                  console.error('공개 링크 생성 실패:', err);
                  toast({
                    title: '링크 생성 실패',
                    description: err?.message || '공개 링크 생성에 실패했습니다.',
                    variant: 'destructive',
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              공개 링크 생성
            </Button>
          )}

          {/* 이미지 다운로드 버튼 */}
          <Button
            onClick={handleDownloadImage}
            variant="outline"
            size="sm"
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            이미지 저장
          </Button>

          {/* 편집 모드 버튼 */}
          {!isEditMode ? (
            <>
              <Button
                onClick={handleStartEdit}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                disabled={matches.length === 0}
              >
                <Edit className="w-4 h-4 mr-2" />
                경기 수정
              </Button>
              <Button
                onClick={() => navigate(`/schedule/${scheduleId}/edit`)}
                variant="outline"
                size="sm"
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                설정 수정
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleSaveEdit}
                variant="default"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? '저장 중...' : '저장'}
              </Button>
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
            </>
          )}
          
          {/* 삭제 버튼 */}
          <Button
            onClick={async () => {
              const confirmed = await confirm({
                title: '스케줄 삭제',
                description: '이 스케줄을 삭제하시겠습니까? 삭제된 스케줄은 복구할 수 없습니다.',
                confirmText: '삭제',
                cancelText: '취소',
                confirmVariant: 'destructive',
                icon: (
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                ),
              });

              if (!confirmed) return;

              try {
                await scheduleService.delete(parseInt(scheduleId!));
                toast({
                  title: '삭제 완료',
                  description: '스케줄이 삭제되었습니다.',
                });
                navigate('/schedules');
              } catch (err) {
                console.error(err);
                toast({
                  title: '삭제 실패',
                  description: '스케줄 삭제에 실패했습니다.',
                  variant: 'destructive',
                });
              }
            }}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            삭제
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#D4765A] to-[#B85C3D] border-0 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-bold">{attendances.length}</div>
            <div className="text-sm text-white/80">참석자</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#2E7D4E] to-[#1F5A35] border-0 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🎾</div>
            <div className="text-3xl font-bold">{matches.length / 2}</div>
            <div className="text-sm text-white/80">경기</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#4A9D6F] to-[#357A52] border-0 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl mb-2">🏟️</div>
            <div className="text-3xl font-bold">A & B</div>
            <div className="text-sm text-white/80">코트</div>
          </CardContent>
        </Card>
      </div>

      {/* 편집 모드 안내 */}
      {isEditMode && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">✏️</div>
              <div>
                <h3 className="font-bold text-blue-900">편집 모드</h3>
                <p className="text-sm text-blue-700">
                  선수를 드래그하여 경기 배정을 수정할 수 있습니다. 완료 후 저장 버튼을 눌러주세요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches List */}
      <div className="space-y-8">
        {matches.length === 0 ? (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">경기가 아직 생성되지 않았습니다</h3>
              <p className="text-gray-600 mb-6">
                스케줄은 생성되었지만 경기 배정이 완료되지 않았습니다.<br />
                경기를 생성하거나 기존 스케줄을 수정해주세요.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate(`/schedule/${scheduleId}/generate`)}
                  className="bg-emerald-600 text-white hover:shadow-lg"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  경기 생성하기
                </Button>
                <Button
                  onClick={() => navigate('/schedules')}
                  variant="outline"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  목록으로
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : isEditMode ? (
          // 편집 모드: 드래그 가능한 카드
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid gap-6">
              {editedMatches
                .reduce((groups: GeneratedMatch[][], match) => {
                  const groupIdx = match.match_number - 1;
                  if (!groups[groupIdx]) groups[groupIdx] = [];
                  groups[groupIdx].push(match);
                  return groups;
                }, [])
                .map((matchGroup, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {idx + 1}
                      </div>
                      <h3 className="text-2xl font-bold">경기 {idx + 1}</h3>
                      {matchGroup[0]?.start_time && (
                        <span className="text-gray-500">{matchGroup[0].start_time} - 30분</span>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {matchGroup.map(match => {
                        const matchIndex = editedMatches.findIndex(
                          m => m.match_number === match.match_number && m.court === match.court
                        );
                        return (
                          <DraggableMatchCard
                            key={`${match.match_number}-${match.court}`}
                            match={match}
                            matchIndex={matchIndex}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </DndContext>
        ) : (
          // 일반 모드: 기존 뷰
          matchesByNumber.map(({ matchNumber, courtA, courtB }, idx) => (
          <Card
            key={matchNumber}
            className="border-2 hover:border-[#D4765A]/20 transition-all"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {matchNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl">경기 {matchNumber}</CardTitle>
                      {courtA?.match_type && (
                        <span className={`px-3 py-1 rounded-lg font-medium text-sm border-2 flex items-center gap-1 ${
                          courtA.match_type === 'mixed' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                          courtA.match_type === 'mens' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-pink-100 text-pink-700 border-pink-200'
                        }`}>
                          <span>{courtA.match_type === 'mixed' ? '🎾' : courtA.match_type === 'mens' ? '👨‍🦱' : '👩‍🦱'}</span>
                          <span>{courtA.match_type === 'mixed' ? '혼복' : courtA.match_type === 'mens' ? '남복' : '여복'}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {courtA?.start_time || courtB?.start_time} - {courtA?.start_time ? '30분' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Court A */}
                {courtA && (
                  <div className="border-2 border-[#D4765A]/20 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50">
                    <div className="mb-4">
                      <div className="px-4 py-2 bg-gradient-to-r from-[#D4765A] to-[#B85C3D] rounded-xl font-bold text-lg text-white shadow-md inline-block">
                        코트 A
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <span className="font-semibold text-gray-900">
                          {getPlayerName(courtA.player1)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(courtA.player1)}`}>
                          {getPlayerLabel(courtA.player1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <span className="font-semibold text-gray-900">
                          {getPlayerName(courtA.player2)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(courtA.player2)}`}>
                          {getPlayerLabel(courtA.player2)}
                        </span>
                      </div>
                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t-2 border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-4 bg-white text-sm font-bold text-gray-500">VS</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                        <span className="font-semibold text-gray-900">
                          {getPlayerName(courtA.player3)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(courtA.player3)}`}>
                          {getPlayerLabel(courtA.player3)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                        <span className="font-semibold text-gray-900">
                          {getPlayerName(courtA.player4)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(courtA.player4)}`}>
                          {getPlayerLabel(courtA.player4)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Court B */}
                {courtB && (
                  <div className="border-2 border-[#2E7D4E]/20 rounded-2xl p-6 bg-gradient-to-br from-white to-gray-50">
                    <div className="mb-4">
                      <div className="px-4 py-2 bg-gradient-to-r from-[#2E7D4E] to-[#1F5A35] rounded-xl font-bold text-lg text-white shadow-md inline-block">
                        코트 B
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <span className="font-semibold text-gray-900">
                          {getPlayerName(courtB.player1)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(courtB.player1)}`}>
                          {getPlayerLabel(courtB.player1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-200 rounded-xl">
                        <span className="font-semibold text-gray-900">
                          {getPlayerName(courtB.player2)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(courtB.player2)}`}>
                          {getPlayerLabel(courtB.player2)}
                        </span>
                      </div>
                      <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t-2 border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-4 bg-white text-sm font-bold text-gray-500">VS</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                        <span className="font-semibold text-gray-900">
                          {getPlayerName(courtB.player3)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(courtB.player3)}`}>
                          {getPlayerLabel(courtB.player3)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 border-2 border-red-200 rounded-xl">
                        <span className="font-semibold text-gray-900">
                          {getPlayerName(courtB.player4)}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlayerLabelColor(courtB.player4)}`}>
                          {getPlayerLabel(courtB.player4)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )))}
      </div>

      {/* 숨겨진 CompactScheduleView - 이미지 다운로드용 */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }} ref={compactViewRef}>
        {schedule && matches.length > 0 && (
          <CompactScheduleView
            matches={matches.map(m => ({
              match_number: m.match_number,
              court: m.court,
              start_time: m.start_time,
              match_type: m.match_type,
              team1: [m.player1, m.player2].filter((p): p is Attendance => !!p) as [Attendance, Attendance],
              team2: [m.player3, m.player4].filter((p): p is Attendance => !!p) as [Attendance, Attendance],
            }))}
            date={schedule.date}
            startTime={schedule.start_time}
            endTime={schedule.end_time}
            clubName={currentClub?.name}
          />
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}

