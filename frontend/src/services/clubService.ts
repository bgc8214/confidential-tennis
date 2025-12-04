import { supabase } from '../lib/supabase';

export interface Club {
  id: number;
  name: string;
  description: string | null;
  code: string;
  logo_url: string | null;
  owner_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ClubMember {
  id: number;
  club_id: number;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  club?: Club;
}

export const clubService = {
  // 클럽 생성
  async create(name: string, description?: string): Promise<Club> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    // 클럽 코드 생성 (8자리 대문자)
    const code = this.generateClubCode();

    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name,
        description: description || null,
        code,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 클럽 코드 생성
  generateClubCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  },

  // 사용자가 속한 클럽 목록 조회
  async getUserClubs(): Promise<ClubMember[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    const { data, error } = await supabase
      .from('club_members')
      .select(`
        *,
        club:clubs(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 클럽 코드로 가입
  async joinByCode(code: string): Promise<ClubMember> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('로그인이 필요합니다.');

    // 클럽 조회
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (clubError || !club) {
      throw new Error('유효하지 않은 클럽 코드입니다.');
    }

    // 클럽 가입
    const { data, error } = await supabase
      .from('club_members')
      .insert({
        club_id: club.id,
        user_id: user.id,
        role: 'member',
      })
      .select(`
        *,
        club:clubs(*)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('이미 가입된 클럽입니다.');
      }
      throw error;
    }

    return data;
  },

  // 클럽 정보 조회
  async getById(id: number): Promise<Club> {
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // 클럽 수정
  async update(id: number, updates: Partial<Club>): Promise<Club> {
    const { data, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 클럽 삭제
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};


