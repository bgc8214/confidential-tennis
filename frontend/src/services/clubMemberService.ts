import { supabase } from '../lib/supabase';
import type { ClubMember } from '../types';

export const clubMemberService = {
  // 특정 클럽의 멤버 목록 조회
  async getClubMembers(clubId: number): Promise<ClubMember[]> {
    console.log('🔍 getClubMembers 호출됨 - clubId:', clubId);

    const { data, error } = await supabase
      .from('club_members')
      .select('*')
      .eq('club_id', clubId)
      .order('role', { ascending: true }); // owner, admin, member 순

    console.log('✅ club_members 조회 결과:', data);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // user_profiles를 별도로 조회하여 매핑
    const userIds = data.map(m => m.user_id);
    console.log('👥 user_profiles 조회할 user_ids:', userIds);

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    console.log('✅ user_profiles 조회 결과:', profiles);

    // 프로필 매핑
    return data.map(member => ({
      ...member,
      user_profile: profiles?.find(p => p.id === member.user_id) || null,
    }));
  },

  // 모든 클럽의 멤버 조회 (슈퍼 어드민 전용)
  async getAllClubMembers(): Promise<ClubMember[]> {
    const { data, error } = await supabase
      .from('club_members')
      .select('*')
      .order('club_id', { ascending: true });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // user_profiles를 별도로 조회하여 매핑
    const userIds = data.map(m => m.user_id);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .in('id', userIds);

    // 프로필 매핑
    return data.map(member => ({
      ...member,
      user_profile: profiles?.find(p => p.id === member.user_id) || null,
    }));
  },

  // 멤버 권한 변경
  async updateMemberRole(
    memberId: number,
    newRole: 'owner' | 'admin' | 'member'
  ): Promise<void> {
    const { error } = await supabase
      .from('club_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) throw error;
  },

  // 멤버 삭제 (클럽에서 제거)
  async removeMember(memberId: number): Promise<void> {
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },

  // 현재 사용자의 클럽 내 권한 조회
  async getCurrentUserRole(clubId: number): Promise<'owner' | 'admin' | 'member' | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('club_members')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', user.id)
      .single();

    if (error) return null;
    return data?.role || null;
  },
};
