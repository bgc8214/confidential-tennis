import { supabase } from '../lib/supabase';
import type { Member } from '../types';

export const memberService = {
  // 클럽별 전체 회원 조회
  async getAll(clubId: number): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('club_id', clubId)
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
  async create(clubId: number, member: Omit<Member, 'id' | 'club_id' | 'created_at' | 'updated_at'>): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert([{ ...member, club_id: clubId }])
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
  },

  // 클럽 전체 회원 통계 (연도별)
  async getClubStatistics(clubId: number, year: number) {
    try {
      // 1. 해당 연도의 모든 스케줄 ID 가져오기
      const { data: schedules, error: schedError } = await supabase
        .from('schedules')
        .select('id')
        .eq('club_id', clubId)
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`);

      if (schedError) throw schedError;

      const scheduleIds = schedules?.map(s => s.id) || [];
      const totalSchedules = scheduleIds.length;

      if (scheduleIds.length === 0) {
        return { members: [], totalSchedules: 0 };
      }

      // 2. 회원 목록 가져오기
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('id, name')
        .eq('club_id', clubId)
        .eq('is_active', true)
        .order('name');

      if (membersError) throw membersError;

      // 3. 참석 데이터 가져오기 (한 번에)
      const { data: attendances, error: attError } = await supabase
        .from('attendances')
        .select('member_id, schedule_id')
        .in('schedule_id', scheduleIds)
        .not('member_id', 'is', null);

      if (attError) throw attError;

      // 4. 경기 데이터 가져오기 (한 번에)
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('player1_id, player2_id, player3_id, player4_id')
        .in('schedule_id', scheduleIds);

      if (matchError) throw matchError;

      // 5. 회원별로 집계
      const statistics = members?.map(member => {
        // 참석 횟수
        const attendanceCount = attendances?.filter(a => a.member_id === member.id).length || 0;

        // 경기 횟수
        let matchCount = 0;
        matches?.forEach(match => {
          if (
            match.player1_id === member.id ||
            match.player2_id === member.id ||
            match.player3_id === member.id ||
            match.player4_id === member.id
          ) {
            matchCount++;
          }
        });

        return {
          memberId: member.id,
          memberName: member.name,
          totalSchedules,
          attendanceCount,
          matchCount,
          attendanceRate: totalSchedules > 0 ? (attendanceCount / totalSchedules) * 100 : 0
        };
      }) || [];

      return {
        members: statistics,
        totalSchedules
      };
    } catch (error) {
      console.error('통계 조회 에러:', error);
      throw error;
    }
  }
};
