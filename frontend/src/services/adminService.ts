import { supabase } from '../lib/supabase';
import type { Club, ClubMember, UserProfile } from '../types';

export const adminService = {
  // 모든 클럽 조회 (슈퍼 어드민 전용)
  async getAllClubs(): Promise<Club[]> {
    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        member_count:club_members(count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // member_count 집계
    return (data || []).map(club => ({
      ...club,
      member_count: club.member_count?.[0]?.count || 0,
    }));
  },

  // 특정 클럽의 멤버 조회 (슈퍼 어드민 전용)
  async getClubMembersAsAdmin(clubId: number): Promise<ClubMember[]> {
    const { data, error } = await supabase
      .from('club_members')
      .select(`
        *,
        user_profile:user_profiles!club_members_user_id_fkey(*)
      `)
      .eq('club_id', clubId)
      .order('role', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 현재 사용자가 슈퍼 어드민인지 확인
  async isSuperAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (error) return false;
    return data?.is_super_admin || false;
  },

  // 사용자 프로필 조회
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  },
};
