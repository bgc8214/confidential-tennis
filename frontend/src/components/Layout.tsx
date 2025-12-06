import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';
import { useIsSuperAdmin } from '../hooks/useIsSuperAdmin';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogOut, LogIn, Users, ChevronDown, Settings } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { currentClub, userClubs, setCurrentClub, loading: clubLoading } = useClub();
  const { isSuperAdmin } = useIsSuperAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3" onClick={closeMobileMenu}>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#D4765A] to-[#2E7D4E] flex items-center justify-center shadow-lg">
                <span className="text-xl sm:text-2xl">🎾</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Tennis Club</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Schedule Manager</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {isLoggedIn && (
                <nav className="flex gap-2">
                  <NavLink to="/" active={location.pathname === '/'}>홈</NavLink>
                  <NavLink to="/members" active={location.pathname.startsWith('/members')}>회원</NavLink>
                  <NavLink to="/schedules" active={location.pathname.startsWith('/schedule')}>스케줄</NavLink>
                  <NavLink to="/stats" active={location.pathname.startsWith('/stats')}>통계</NavLink>
                  <NavLink to="/club-members" active={location.pathname.startsWith('/club-members')}>클럽 멤버</NavLink>
                  {isSuperAdmin && (
                    <NavLink to="/admin" active={location.pathname.startsWith('/admin')} className="text-red-600">
                      <Settings className="w-4 h-4 inline mr-1" />
                      시스템 관리
                    </NavLink>
                  )}
                </nav>
              )}

              {/* 클럽 선택 및 사용자 메뉴 */}
              {isLoggedIn && !authLoading && !clubLoading && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="max-w-[150px] truncate">
                        {currentClub?.name || '클럽 선택'}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">{user.email}</span>
                        {currentClub && (
                          <span className="text-sm font-medium mt-1">{currentClub.name}</span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userClubs.map((clubMember) => {
                      const club = clubMember.club;
                      if (!club) return null;
                      const isCurrent = currentClub?.id === club.id;
                      return (
                        <DropdownMenuItem
                          key={club.id}
                          onClick={() => {
                            setCurrentClub(club);
                            navigate('/');
                          }}
                          className={isCurrent ? 'bg-[#2E7D4E]/10' : ''}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          <span className={isCurrent ? 'font-semibold' : ''}>{club.name}</span>
                          {isCurrent && <span className="ml-auto text-xs text-[#2E7D4E]">✓</span>}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/clubs')}>
                      <Users className="w-4 h-4 mr-2" />
                      클럽 관리
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* 로그인하지 않은 경우 */}
              {!isLoggedIn && !authLoading && (
                <Link to="/login">
                  <Button variant="outline" className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    로그인
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="메뉴"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 border-t pt-4 space-y-2 animate-fade-in">
              {/* 모바일 클럽 선택 */}
              {isLoggedIn && !authLoading && !clubLoading && (
                <div className="mb-4 px-4 py-3 bg-gray-50 rounded-xl">
                  <div className="text-xs text-gray-500 mb-2">현재 클럽</div>
                  <div className="font-semibold text-gray-900 mb-3">
                    {currentClub?.name || '클럽을 선택해주세요'}
                  </div>
                  {userClubs.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 mb-1">클럽 전환</div>
                      {userClubs.map((clubMember) => {
                        const club = clubMember.club;
                        if (!club) return null;
                        const isCurrent = currentClub?.id === club.id;
                        return (
                          <button
                            key={club.id}
                            onClick={() => {
                              setCurrentClub(club);
                              closeMobileMenu();
                              navigate('/');
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                              isCurrent
                                ? 'bg-[#2E7D4E] text-white font-semibold'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{club.name}</span>
                              {isCurrent && <span className="text-xs">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                      <button
                        onClick={() => {
                          navigate('/clubs');
                          closeMobileMenu();
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 mt-2"
                      >
                        <Users className="w-4 h-4 inline mr-2" />
                        클럽 관리
                      </button>
                    </div>
                  )}
                </div>
              )}

              <MobileNavLink
                to="/"
                active={location.pathname === '/'}
                onClick={closeMobileMenu}
              >
                🏠 홈
              </MobileNavLink>
              {isLoggedIn && (
                <>
                  <MobileNavLink
                    to="/members"
                    active={location.pathname.startsWith('/members')}
                    onClick={closeMobileMenu}
                  >
                    👥 회원 관리
                  </MobileNavLink>
                  <MobileNavLink
                    to="/schedules"
                    active={location.pathname.startsWith('/schedule')}
                    onClick={closeMobileMenu}
                  >
                    📅 스케줄 관리
                  </MobileNavLink>
                  <MobileNavLink
                    to="/stats"
                    active={location.pathname.startsWith('/stats')}
                    onClick={closeMobileMenu}
                  >
                    📊 통계
                  </MobileNavLink>
                  <MobileNavLink
                    to="/club-members"
                    active={location.pathname.startsWith('/club-members')}
                    onClick={closeMobileMenu}
                  >
                    👥 클럽 멤버
                  </MobileNavLink>
                  {isSuperAdmin && (
                    <MobileNavLink
                      to="/admin"
                      active={location.pathname.startsWith('/admin')}
                      onClick={closeMobileMenu}
                    >
                      ⚙️ 시스템 관리
                    </MobileNavLink>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      closeMobileMenu();
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl font-medium transition-all bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    🚪 로그아웃
                  </button>
                </>
              )}
              {!isLoggedIn && (
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-[#D4765A] to-[#2E7D4E] text-white shadow-lg"
                >
                  🔐 로그인
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="w-full px-4 sm:px-6 py-6 sm:py-12">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#2E7D4E] to-[#D4765A] text-white mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-lg sm:text-base">Tennis Club Schedule Manager</p>
              <p className="text-sm text-white/80 mt-1">매주 토요일, 함께 만드는 즐거운 경기</p>
            </div>
            <div className="flex gap-6 sm:gap-8">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">6</p>
                <p className="text-xs text-white/80">경기</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">2</p>
                <p className="text-xs text-white/80">코트</p>
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold">8-12</p>
                <p className="text-xs text-white/80">참석자</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/20 text-center text-sm text-white/70">
            © 2024 Tennis Club. Powered by Supabase & React.
          </div>
        </div>
      </footer>
    </div>
  );
}

interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ to, active, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
        active
          ? 'bg-gradient-to-r from-[#D4765A] to-[#2E7D4E] text-white shadow-lg'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}

interface MobileNavLinkProps {
  to: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function MobileNavLink({ to, active, onClick, children }: MobileNavLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-4 py-3 rounded-xl font-medium transition-all ${
        active
          ? 'bg-gradient-to-r from-[#D4765A] to-[#2E7D4E] text-white shadow-lg'
          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
}
