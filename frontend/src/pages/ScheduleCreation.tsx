import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { memberService } from '../services/memberService';
import { scheduleService } from '../services/scheduleService';
import type { Member } from '../types';
import AttendeeSelector from '../components/AttendeeSelector';
import GuestInput from '../components/GuestInput';

export default function ScheduleCreation() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMembers();
    // Set default date to next Saturday
    setDate(getNextSaturday());
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await memberService.getAll();
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

  const calculateEndTime = (start: string): string => {
    const [hours, minutes] = start.split(':').map(Number);
    const endHours = hours + 3; // 6경기 × 30분 = 3시간
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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

      // 1. 스케줄 생성
      const schedule = await scheduleService.create({
        date,
        start_time: startTime,
        end_time: calculateEndTime(startTime),
        status: 'planned',
        notes: null
      });

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

      // 3. 스케줄 생성 완료 - 다음 단계로 이동 (경기 배정)
      navigate(`/schedule/${schedule.id}/generate`);
    } catch (err) {
      setError('스케줄 생성에 실패했습니다.');
      console.error(err);
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
      <div>
        <h2 className="text-3xl font-bold text-gray-900">스케줄 생성</h2>
        <p className="text-gray-600 mt-2">
          참석자를 선택하고 경기 일정을 생성합니다. (8-12명)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Time */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">날짜 및 시간</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                날짜 *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시작 시간 *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                종료 예정: {calculateEndTime(startTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Attendee Selector */}
        <AttendeeSelector
          members={members}
          selectedMemberIds={selectedMemberIds}
          onMemberToggle={handleMemberToggle}
        />

        {/* Guest Input */}
        <GuestInput
          guests={guests}
          onAddGuest={handleAddGuest}
          onRemoveGuest={handleRemoveGuest}
        />

        {/* Summary */}
        <div className={`rounded-lg p-4 ${
          isValidAttendeeCount
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <p className={isValidAttendeeCount ? 'text-green-800' : 'text-yellow-800'}>
            총 <span className="font-bold">{totalAttendees}</span>명의 참석자
            {!isValidAttendeeCount && (
              <span className="ml-2">
                (8-12명 필요)
              </span>
            )}
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={!isValidAttendeeCount || isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '생성 중...' : '다음 단계: 경기 배정'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
