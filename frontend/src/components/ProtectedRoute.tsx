import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requireClub?: boolean;
}

export default function ProtectedRoute({ children, requireClub = true }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { currentClub, loading: clubLoading } = useClub();

  if (authLoading || clubLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2E7D4E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않았으면 로그인 페이지로
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 클럽이 필요한데 선택된 클럽이 없으면 클럽 선택 페이지로
  if (requireClub && !currentClub) {
    return <Navigate to="/clubs" replace />;
  }

  return <>{children}</>;
}

