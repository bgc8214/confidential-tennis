import { supabase } from '../lib/supabase';
import type { Schedule, Match, Attendance } from '../types';

/**
 * 공개 스케줄 조회 서비스
 * 비로그인 사용자도 공개 링크로 스케줄을 조회할 수 있습니다.
 */
export const publicScheduleService = {
  // 공개 링크로 스케줄 조회
  async getScheduleByPublicLink(publicLink: string): Promise<Schedule | null> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('public_link', publicLink.toUpperCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('공개 스케줄 조회 실패:', error);
      throw error;
    }

    return data || null;
  },

  // 공개 스케줄의 참석자 조회
  async getAttendances(scheduleId: number): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select('*, member:members(*)')
      .eq('schedule_id', scheduleId);

    if (error) {
      console.error('참석자 조회 실패:', error);
      throw error;
    }

    return data || [];
  },

  // 공개 스케줄의 경기 목록 조회
  async getMatches(scheduleId: number): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('match_number');

    if (error) {
      console.error('경기 조회 실패:', error);
      throw error;
    }

    // 참석자 정보를 별도로 조회하여 매핑
    const { data: attendancesData } = await supabase
      .from('attendances')
      .select('*, member:members(*)')
      .eq('schedule_id', scheduleId);

    const attendancesMap = new Map((attendancesData || []).map(a => [a.id, a]));

    return (data || []).map(match => ({
      ...match,
      player1: match.player1_id ? attendancesMap.get(match.player1_id) : null,
      player2: match.player2_id ? attendancesMap.get(match.player2_id) : null,
      player3: match.player3_id ? attendancesMap.get(match.player3_id) : null,
      player4: match.player4_id ? attendancesMap.get(match.player4_id) : null,
    })) as Match[];
  },
};



