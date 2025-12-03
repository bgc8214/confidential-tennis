import { supabase } from '../lib/supabase';
import type { Member } from '../types';

export const memberService = {
  // 전체 회원 조회
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  // 특정 회원 조회
  async getById(id: number): Promise<Member | null> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 회원 등록
  async create(member: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert([member])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 회원 수정
  async update(id: number, member: Partial<Member>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .update(member)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 회원 삭제 (소프트 삭제)
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('members')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // 회원 통계
  async getStats(id: number) {
    // 참석 횟수 조회
    const { data: attendances, error } = await supabase
      .from('attendances')
      .select('id, schedule_id, schedules(date)')
      .eq('member_id', id);

    if (error) throw error;

    return {
      totalAttendances: attendances?.length || 0,
      // 추가 통계는 추후 구현
    };
  }
};
