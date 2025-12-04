import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { clubService } from '../services/clubService';
import type { Club, ClubMember } from '../services/clubService';

interface ClubContextType {
  currentClub: Club | null;
  userClubs: ClubMember[];
  loading: boolean;
  setCurrentClub: (club: Club | null) => void;
  refreshClubs: () => Promise<void>;
  createClub: (name: string, description?: string) => Promise<Club>;
  joinClub: (code: string) => Promise<void>;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentClub, setCurrentClub] = useState<Club | null>(null);
  const [userClubs, setUserClubs] = useState<ClubMember[]>([]);
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

  return (
    <ClubContext.Provider
      value={{
        currentClub,
        userClubs,
        loading,
        setCurrentClub: handleSetCurrentClub,
        refreshClubs,
        createClub,
        joinClub,
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

