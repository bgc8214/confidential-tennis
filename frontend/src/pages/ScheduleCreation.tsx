import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberService } from '../services/memberService';
import { scheduleService } from '../services/scheduleService';
import { useClub } from '../contexts/ClubContext';
import type { Member, MatchSettings } from '../types';
import AttendeeSelector from '../components/AttendeeSelector';
import GuestInput from '../components/GuestInput';
import ConstraintPanel, { type ConstraintData } from '../components/ConstraintPanel';
import AdvancedScheduleSettings from '../components/AdvancedScheduleSettings';

export default function ScheduleCreation() {
  const navigate = useNavigate();
  const { currentClub } = useClub();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [matchSettings, setMatchSettings] = useState<MatchSettings>({
    totalMatches: 6,
    matchDuration: 30,
    courtCount: 2,
    matchTypes: ['mixed', 'mixed', 'mixed', 'mixed', 'mixed', 'mixed'],
    courtTypes: undefined // 코트별 타입은 선택사항
  });
  const [generatePublicLink, setGeneratePublicLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [constraints, setConstraints] = useState<ConstraintData>({
    excludeLastMatch: [],
    partnerPairs: [],
    excludeMatches: []
  });

  useEffect(() => {
    if (currentClub) {
      loadMembers();
      // Set default date to next Saturday
      setDate(getNextSaturday());
    }
  }, [currentClub]);

  const loadMembers = async () => {
    if (!currentClub) return;
    
    try {
      setLoading(true);
      const data = await memberService.getAll(currentClub.id);
      setMembers(data);
      setError(null);
    } catch (err) {
      setError('회원 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getNextSaturday = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    const nextSaturday = new Date(today);
    nextSaturday.setDate(today.getDate() + daysUntilSaturday);
    return nextSaturday.toISOString().split('T')[0];
  };

  const handleMemberToggle = (memberId: number) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAddGuest = (guestName: string) => {
    if (guestName.trim() && !guests.includes(guestName.trim())) {
      setGuests(prev => [...prev, guestName.trim()]);
    }
  };

  const handleRemoveGuest = (guestName: string) => {
    setGuests(prev => prev.filter(name => name !== guestName));
  };

  const handleDateChange = async (newDate: string) => {
    setDate(newDate);
    setDateWarning(null);

    if (!currentClub || !newDate) return;

    try {
      const existingSchedule = await scheduleService.getByDate(currentClub.id, newDate);
      if (existingSchedule) {
        setDateWarning(`이 날짜에 이미 스케줄이 있습니다. (ID: ${existingSchedule.id})`);
      }
    } catch (err) {
      console.error('날짜 확인 에러:', err);
    }
  };

  const calculateTotalMinutes = (): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return endTotalMinutes - startTotalMinutes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalAttendees = selectedMemberIds.length + guests.length;
    if (totalAttendees < 8) {
      setError('최소 8명 이상의 참석자가 필요합니다.');
      return;
    }
    if (totalAttendees > 12) {
      setError('최대 12명까지 참석 가능합니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (!currentClub) {
        setError('클럽을 선택해주세요.');
        return;
      }

      // 시간 유효성 검사
      if (endTime <= startTime) {
        setError('종료 시간은 시작 시간보다 늦어야 합니다.');
        setIsSubmitting(false);
        return;
      }

      // 1. 스케줄 생성
      const scheduleData: any = {
        date,
        start_time: startTime,
        end_time: endTime,
        match_type: matchSettings.matchTypes[0] || 'mixed', // 첫 번째 경기 타입을 기본값으로 (하위 호환성)
        total_matches: matchSettings.totalMatches,
        match_duration: matchSettings.matchDuration,
        court_count: matchSettings.courtCount,
        status: 'planned',
        notes: null
      };

      // 경기별 타입 배열 저장 (JSON 배열)
      if (matchSettings.matchTypes) {
        scheduleData.match_types = matchSettings.matchTypes;
      }

      // 코트별 타입 배열 저장 (JSON 배열, 선택사항)
      if (matchSettings.courtTypes) {
        scheduleData.court_types = matchSettings.courtTypes;
      }

      const schedule = await scheduleService.create(
        currentClub.id,
        scheduleData,
        generatePublicLink
      );

      // 2. 참석자 등록
      const attendanceData = [
        ...selectedMemberIds.map(memberId => ({
          member_id: memberId,
          is_guest: false
        })),
        ...guests.map(guestName => ({
          guest_name: guestName,
          is_guest: true
        }))
      ];

      await scheduleService.addAttendances(schedule.id, attendanceData);

      // 3. 제약조건 저장
      const constraintPromises = [];

      // 마지막 경기 제외
      for (const memberId of constraints.excludeLastMatch) {
        constraintPromises.push(
          scheduleService.addConstraint({
            schedule_id: schedule.id,
            constraint_type: 'exclude_last_match',
            member_id_1: memberId,
            member_id_2: null,
            match_number: null
          })
        );
      }

      // 파트너 페어
      for (const [member1, member2] of constraints.partnerPairs) {
        constraintPromises.push(
          scheduleService.addConstraint({
            schedule_id: schedule.id,
            constraint_type: 'partner_pair',
            member_id_1: member1,
            member_id_2: member2,
            match_number: null
          })
        );
      }

      // 특정 경기 제외
      for (const { memberId, matchNumber } of constraints.excludeMatches) {
        constraintPromises.push(
          scheduleService.addConstraint({
            schedule_id: schedule.id,
            constraint_type: 'exclude_match',
            member_id_1: memberId,
            member_id_2: null,
            match_number: matchNumber
          })
        );
      }

      await Promise.all(constraintPromises);

      // 4. 스케줄 생성 완료 - 다음 단계로 이동 (경기 배정)
      navigate(`/schedule/${schedule.id}/generate`);
    } catch (err: any) {
      console.error('스케줄 생성 에러:', err);

      // 중복 스케줄 에러 처리
      if (err?.code === '23505' || err?.message?.includes('duplicate key')) {
        setError(`${date} 날짜에 이미 스케줄이 존재합니다. 다른 날짜를 선택하거나 기존 스케줄을 수정해주세요.`);
      } else {
        setError(err?.message || '스케줄 생성에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  const totalAttendees = selectedMemberIds.length + guests.length;
  const isValidAttendeeCount = totalAttendees >= 8 && totalAttendees <= 12;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h2 className="text-4xl font-bold text-gray-900 mb-2">
          새 스케줄 만들기
        </h2>
        <p className="text-gray-600">
          참석자를 선택하고 제약조건을 설정한 후 경기 일정을 생성합니다. (8-12명)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl animate-slide-in">
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Time */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 border-2 border-gray-100 animate-scale-in">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <span className="text-3xl">📅</span>
            <span>날짜 및 시간</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날짜 *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors ${
                  dateWarning
                    ? 'border-yellow-400 focus:border-yellow-500'
                    : 'border-gray-200 focus:border-[#D4765A]'
                }`}
              />
              {dateWarning && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{dateWarning}</span>
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 시간 *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D4765A] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 시간 *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#D4765A] transition-colors"
              />
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            <p>
              총 <span className="font-semibold text-gray-700">{calculateTotalMinutes()}분</span>
              ({Math.floor(calculateTotalMinutes() / 60)}시간 {calculateTotalMinutes() % 60 > 0 ? `${calculateTotalMinutes() % 60}분` : ''})
            </p>
          </div>
        </div>

        {/* Advanced Schedule Settings */}
        <div className="animate-scale-in stagger-1">
          <AdvancedScheduleSettings
            settings={matchSettings}
            onSettingsChange={setMatchSettings}
          />
        </div>

        {/* Attendee Selector */}
        <div className="animate-scale-in stagger-2">
          <AttendeeSelector
            members={members}
            selectedMemberIds={selectedMemberIds}
            onMemberToggle={handleMemberToggle}
          />
        </div>

        {/* Guest Input */}
        <div className="animate-scale-in stagger-3">
          <GuestInput
            guests={guests}
            onAddGuest={handleAddGuest}
            onRemoveGuest={handleRemoveGuest}
          />
        </div>

        {/* Constraint Panel */}
        <div className="animate-scale-in stagger-4">
          <ConstraintPanel
            members={members}
            selectedMemberIds={selectedMemberIds}
            constraints={constraints}
            onConstraintsChange={setConstraints}
          />
        </div>

        {/* Summary */}
        <div className={`rounded-2xl p-6 border-2 animate-scale-in stagger-5 ${
          isValidAttendeeCount
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <p className={`text-lg font-medium ${isValidAttendeeCount ? 'text-green-800' : 'text-yellow-800'}`}>
            총 <span className="font-bold text-2xl">{totalAttendees}</span>명의 참석자
            {!isValidAttendeeCount && (
              <span className="ml-2">
                (8-12명 필요)
              </span>
            )}
          </p>
          {constraints.excludeLastMatch.length + constraints.partnerPairs.length + constraints.excludeMatches.length > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              제약조건: {constraints.excludeLastMatch.length + constraints.partnerPairs.length + constraints.excludeMatches.length}개 적용됨
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-6 z-10 animate-scale-in stagger-6">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-6">
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={!isValidAttendeeCount || isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#D4765A] to-[#2E7D4E] text-white py-4 rounded-xl font-bold hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:scale-105 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span>다음 단계: 경기 배정</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
                className="px-8 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
