import { supabase } from '../lib/supabase';
import type { Schedule, Attendance, Match, Constraint } from '../types';

export const scheduleService = {
  // 클럽별 스케줄 목록 조회 (월별)
  async getByMonth(clubId: number, year: number, month: number): Promise<Schedule[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('club_id', clubId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 클럽별 특정 날짜 스케줄 조회
  async getByDate(clubId: number, date: string): Promise<Schedule | null> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('club_id', clubId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  // ID로 스케줄 조회
  async getById(id: number): Promise<Schedule | null> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // 공개 링크 문자열 생성 헬퍼 (16자리 대문자)
  _createPublicLinkString(): string {
    return Math.random().toString(36).substring(2, 18).toUpperCase();
  },

  // 스케줄 생성
  async create(clubId: number, schedule: Omit<Schedule, 'id' | 'club_id' | 'created_at' | 'updated_at'>, generatePublicLink: boolean = false): Promise<Schedule> {
    const scheduleData: any = { ...schedule, club_id: clubId };

    if (generatePublicLink) {
      scheduleData.public_link = this._createPublicLinkString();
    }

    const { data, error } = await supabase
      .from('schedules')
      .insert([scheduleData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 공개 링크 생성/업데이트
  async generatePublicLink(scheduleId: number): Promise<string> {
    console.log('generatePublicLink 호출 - scheduleId:', scheduleId, 'type:', typeof scheduleId);
    if (!scheduleId || isNaN(Number(scheduleId)) || scheduleId <= 0) {
      throw new Error(`유효하지 않은 스케줄 ID입니다: ${scheduleId}`);
    }

    // 공개 링크 문자열 생성
    const publicLink = this._createPublicLinkString();

    const { error } = await supabase
      .from('schedules')
      .update({ public_link: publicLink })
      .eq('id', scheduleId);

    if (error) {
      console.error('Supabase 업데이트 에러:', error);
      throw error;
    }
    return publicLink;
  },

  // 공개 링크 삭제
  async removePublicLink(scheduleId: number): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .update({ public_link: null })
      .eq('id', scheduleId);

    if (error) throw error;
  },

  // 스케줄 수정
  async update(id: number, schedule: Partial<Schedule>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .update(schedule)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 스케줄 삭제
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 참석자 조회
  async getAttendances(scheduleId: number): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select('*, member:members(*)')
      .eq('schedule_id', scheduleId);

    if (error) throw error;
    return data || [];
  },

  // 참석자 등록 (벌크)
  async addAttendances(scheduleId: number, attendances: Array<{
    member_id?: number;
    guest_name?: string;
    is_guest: boolean;
  }>): Promise<Attendance[]> {
    const attendancesWithSchedule = attendances.map(a => ({
      ...a,
      schedule_id: scheduleId
    }));

    const { data, error } = await supabase
      .from('attendances')
      .insert(attendancesWithSchedule)
      .select();

    if (error) throw error;
    return data || [];
  },

  // 경기 목록 조회
  async getMatches(scheduleId: number): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:attendances!matches_player1_id_fkey(*, member:members(*)),
        player2:attendances!matches_player2_id_fkey(*, member:members(*)),
        player3:attendances!matches_player3_id_fkey(*, member:members(*)),
        player4:attendances!matches_player4_id_fkey(*, member:members(*))
      `)
      .eq('schedule_id', scheduleId)
      .order('match_number');

    if (error) {
      // 외래키 관계가 제대로 설정되지 않은 경우 직접 조회
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('match_number');

      if (matchesError) throw matchesError;

      // 참석자 정보를 별도로 조회하여 매핑
      const { data: attendancesData } = await supabase
        .from('attendances')
        .select('*, member:members(*)')
        .eq('schedule_id', scheduleId);

      const attendancesMap = new Map((attendancesData || []).map(a => [a.id, a]));

      return (matchesData || []).map(match => ({
        ...match,
        player1: match.player1_id ? attendancesMap.get(match.player1_id) : null,
        player2: match.player2_id ? attendancesMap.get(match.player2_id) : null,
        player3: match.player3_id ? attendancesMap.get(match.player3_id) : null,
        player4: match.player4_id ? attendancesMap.get(match.player4_id) : null,
      })) as Match[];
    }

    return data || [];
  },

  // 경기 생성 (벌크)
  async addMatches(matches: Array<Omit<Match, 'id' | 'created_at' | 'updated_at'>>): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .insert(matches)
      .select();

    if (error) throw error;
    return data || [];
  },

  // 경기 수정
  async updateMatch(id: number, match: Partial<Match>): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update(match)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 제약조건 조회
  async getConstraints(scheduleId: number): Promise<Constraint[]> {
    const { data, error } = await supabase
      .from('constraints')
      .select('*')
      .eq('schedule_id', scheduleId);

    if (error) throw error;
    return data || [];
  },

  // 제약조건 추가
  async addConstraint(constraint: Omit<Constraint, 'id' | 'created_at'>): Promise<Constraint> {
    const { data, error } = await supabase
      .from('constraints')
      .insert([constraint])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 제약조건 삭제
  async deleteConstraint(id: number): Promise<void> {
    const { error } = await supabase
      .from('constraints')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 스케줄별 제약조건 전체 삭제
  async deleteConstraintsByScheduleId(scheduleId: number): Promise<void> {
    const { error } = await supabase
      .from('constraints')
      .delete()
      .eq('schedule_id', scheduleId);

    if (error) throw error;
  },

  // 스케줄별 경기 전체 삭제
  async deleteMatchesByScheduleId(scheduleId: number): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('schedule_id', scheduleId);

    if (error) throw error;
  },

  // 스케줄의 경기 전체 업데이트 (기존 삭제 후 새로 생성)
  async updateMatches(scheduleId: number, matches: Array<Omit<Match, 'id' | 'created_at' | 'updated_at'>>): Promise<Match[]> {
    // 1. 기존 경기 삭제
    await this.deleteMatchesByScheduleId(scheduleId);

    // 2. 새 경기 생성
    const { data, error } = await supabase
      .from('matches')
      .insert(matches)
      .select();

    if (error) throw error;
    return data || [];
  }
};
