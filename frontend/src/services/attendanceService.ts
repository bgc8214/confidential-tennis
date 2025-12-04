import { supabase } from '../lib/supabase';
import type { Attendance } from '../types';

export const attendanceService = {
  // 스케줄별 참석자 조회
  async getByScheduleId(scheduleId: number): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select('*, members(*)')
      .eq('schedule_id', scheduleId);

    if (error) throw error;
    return data || [];
  },

  // 참석자 등록 (단일)
  async create(attendance: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendances')
      .insert([attendance])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 참석자 등록 (벌크)
  async createBulk(attendances: Omit<Attendance, 'id' | 'created_at'>[]): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendances')
      .insert(attendances)
      .select();

    if (error) throw error;
    return data || [];
  },

  // 참석자 삭제
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('attendances')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 스케줄별 참석자 전체 삭제
  async deleteByScheduleId(scheduleId: number): Promise<void> {
    const { error } = await supabase
      .from('attendances')
      .delete()
      .eq('schedule_id', scheduleId);

    if (error) throw error;
  }
};
