import { useClub } from '../contexts/ClubContext';

export function useClubPermissions() {
  const { currentRole } = useClub();

  return {
    // 회원/스케줄 관리 권한
    canManageMembers: currentRole === 'owner' || currentRole === 'admin',
    canManageSchedules: currentRole === 'owner' || currentRole === 'admin',

    // 클럽 설정 권한 (owner만)
    canManageSettings: currentRole === 'owner',

    // 클럽 멤버 권한 관리 (owner만)
    canManageRoles: currentRole === 'owner',

    // 읽기 전용 여부
    isReadOnly: currentRole === 'member',

    // 현재 권한
    currentRole,
  };
}
