import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { clubService } from '../services/clubService';
import { clubMemberService } from '../services/clubMemberService';
import type { Club, ClubMember } from '../services/clubService';

interface ClubContextType {
  currentClub: Club | null;
  userClubs: ClubMember[];
  currentRole: 'owner' | 'admin' | 'member' | null;
  loading: boolean;
  setCurrentClub: (club: Club | null) => void;
  refreshClubs: () => Promise<void>;
  createClub: (name: string, description?: string) => Promise<Club>;
  joinClub: (code: string) => Promise<void>;
  updateClub: (id: number, updates: Partial<Club>) => Promise<Club>;
  deleteClub: (id: number) => Promise<void>;
  leaveClub: (clubId: number) => Promise<void>;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [userClubs, setUserClubs] = useState<ClubMember[]>([]);
  const [currentRole, setCurrentRole] = useState<'owner' | 'admin' | 'member' | null>(null);
  const [loading, setLoading] = useState(true);

  // 사용자가 속한 클럽 목록 조회
  const refreshClubs = async () => {
    if (!user) {
      setUserClubs([]);
      setCurrentClub(null);
      setLoading(false);
      return;
    }

    try {
      const clubs = await clubService.getUserClubs();
      setUserClubs(clubs);

      // 현재 선택된 클럽이 없거나 더 이상 속하지 않은 클럽이면 첫 번째 클럽 선택
      if (clubs.length > 0) {
        const savedClubId = localStorage.getItem('currentClubId');
        const savedClub = clubs.find(c => c.club_id.toString() === savedClubId);
        
        if (savedClub && savedClub.club) {
          setCurrentClub(savedClub.club);
        } else if (clubs[0].club) {
          setCurrentClub(clubs[0].club);
          localStorage.setItem('currentClubId', clubs[0].club_id.toString());
        }
      } else {
        setCurrentClub(null);
        localStorage.removeItem('currentClubId');
      }
    } catch (error) {
      console.error('클럽 목록 조회 실패:', error);
      setUserClubs([]);
      setCurrentClub(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 현재 클럽이 변경되면 role 조회
  useEffect(() => {
    let mounted = true;

    const fetchRole = async () => {
      if (!currentClub) {
        setCurrentRole(null);
        return;
      }

      try {
        const role = await clubMemberService.getCurrentUserRole(currentClub.id);
        if (mounted) {
          setCurrentRole(role);
        }
      } catch (error) {
        console.error('권한 조회 실패:', error);
        if (mounted) {
          setCurrentRole(null);
        }
      }
    };

    fetchRole();

    return () => {
      mounted = false;
    };
  }, [currentClub]);

  // 현재 클럽 변경 시 로컬 스토리지에 저장
  const handleSetCurrentClub = (club: Club | null) => {
    setCurrentClub(club);
    if (club) {
      localStorage.setItem('currentClubId', club.id.toString());
    } else {
      localStorage.removeItem('currentClubId');
    }
  };

  // 클럽 생성
  const createClub = async (name: string, description?: string): Promise<Club> => {
    const newClub = await clubService.create(name, description);
    await refreshClubs();
    handleSetCurrentClub(newClub);
    return newClub;
  };

  // 클럽 가입
  const joinClub = async (code: string): Promise<void> => {
    await clubService.joinByCode(code);
    await refreshClubs();
  };

  // 클럽 수정
  const updateClub = async (id: number, updates: Partial<Club>): Promise<Club> => {
    const updatedClub = await clubService.update(id, updates);
    await refreshClubs();
    // 현재 선택된 클럽이 수정된 클럽이면 업데이트
    if (currentClub?.id === id) {
      handleSetCurrentClub(updatedClub);
    }
    return updatedClub;
  };

  // 클럽 삭제 (소유자만)
  const deleteClub = async (id: number): Promise<void> => {
    await clubService.delete(id);
    // 현재 선택된 클럽이 삭제된 클럽이면 초기화
    if (currentClub?.id === id) {
      handleSetCurrentClub(null);
    }
    await refreshClubs();
  };

  // 클럽 탈퇴
  const leaveClub = async (clubId: number): Promise<void> => {
    await clubMemberService.leave(clubId);
    // 현재 선택된 클럽에서 탈퇴하면 초기화
    if (currentClub?.id === clubId) {
      handleSetCurrentClub(null);
    }
    await refreshClubs();
  };

  return (
    <ClubContext.Provider
      value={{
        currentClub,
        userClubs,
        currentRole,
        loading,
        setCurrentClub: handleSetCurrentClub,
        refreshClubs,
        createClub,
        joinClub,
        updateClub,
        deleteClub,
        leaveClub,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
}

