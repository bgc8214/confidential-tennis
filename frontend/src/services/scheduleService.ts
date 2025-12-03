import { supabase } from '../lib/supabase';
import type { Schedule, Attendance, Match, Constraint } from '../types';

export const scheduleService = {
  // 스케줄 목록 조회 (월별)
  async getByMonth(year: number, month: number): Promise<Schedule[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 특정 날짜 스케줄 조회
  async getByDate(date: string): Promise<Schedule | null> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  },

  // 스케줄 생성
  async create(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert([schedule])
      .select()
      .single();

    if (error) throw error;
    return data;
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
        player1:attendances!player1_id(*),
        player2:attendances!player2_id(*),
        player3:attendances!player3_id(*),
        player4:attendances!player4_id(*)
      `)
      .eq('schedule_id', scheduleId)
      .order('match_number');

    if (error) throw error;
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
  }
};
