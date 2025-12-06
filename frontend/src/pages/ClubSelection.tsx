import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClub } from '../contexts/ClubContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { Plus, Users, Copy, Check, MoreVertical, Edit, Trash2, LogOut } from 'lucide-react';

export default function ClubSelection() {
  const navigate = useNavigate();
  const { userClubs, currentClub, setCurrentClub, createClub, joinClub, updateClub, deleteClub, leaveClub, loading } = useClub();
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [clubCode, setClubCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingClub, setEditingClub] = useState<any>(null);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const newClub = await createClub(clubName, clubDescription || undefined);
      setShowCreateDialog(false);
      setClubName('');
      setClubDescription('');
      navigate('/');
    } catch (err: any) {
      setError(err.message || '클럽 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setJoining(true);

    try {
      await joinClub(clubCode);
      setShowJoinDialog(false);
      setClubCode('');
      navigate('/');
    } catch (err: any) {
      setError(err.message || '클럽 가입에 실패했습니다.');
    } finally {
      setJoining(false);
    }
  };

  const handleSelectClub = (club: any) => {
    setCurrentClub(club);
    navigate('/');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEditClub = (club: any) => {
    setEditingClub(club);
    setClubName(club.name);
    setClubDescription(club.description || '');
    setShowEditDialog(true);
  };

  const handleUpdateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub) return;

    setError(null);
    setCreating(true);

    try {
      await updateClub(editingClub.id, {
        name: clubName,
        description: clubDescription || null,
      });
      setShowEditDialog(false);
      setEditingClub(null);
      setClubName('');
      setClubDescription('');
    } catch (err: any) {
      setError(err.message || '클럽 수정에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClub = async (club: any) => {
    if (!confirm(`정말로 "${club.name}" 클럽을 삭제하시겠습니까?\n\n모든 회원, 스케줄, 경기 데이터가 삭제됩니다.`)) {
      return;
    }

    try {
      await deleteClub(club.id);
      alert('클럽이 삭제되었습니다.');
    } catch (err: any) {
      alert(err.message || '클럽 삭제에 실패했습니다.');
    }
  };

  const handleLeaveClub = async (club: any) => {
    if (!confirm(`정말로 "${club.name}" 클럽에서 탈퇴하시겠습니까?`)) {
      return;
    }

    try {
      await leaveClub(club.id);
      alert('클럽에서 탈퇴했습니다.');
    } catch (err: any) {
      alert(err.message || '클럽 탈퇴에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2E7D4E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#D4765A] to-[#2E7D4E] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-4xl">🎾</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            테니스 동아리 스케줄 관리
          </h1>
          <p className="text-gray-600">
            {user?.email}님, 환영합니다!
          </p>
        </div>

        {/* 내 클럽 목록 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              내 클럽 목록
            </CardTitle>
            <CardDescription>
              속한 클럽을 선택하거나 새 클럽을 만드세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userClubs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="mb-4">아직 속한 클럽이 없습니다.</p>
                <p>새 클럽을 만들거나 클럽 코드로 가입하세요.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {userClubs.map((clubMember) => {
                  const club = clubMember.club;
                  if (!club) return null;

                  const isCurrent = currentClub?.id === club.id;
                  const roleLabels = {
                    owner: '소유자',
                    admin: '관리자',
                    member: '회원',
                  };

                  return (
                    <div
                      key={club.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-[#2E7D4E] bg-[#2E7D4E]/5 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => handleSelectClub(club)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900">
                            {club.name}
                            {isCurrent && (
                              <span className="ml-2 text-sm text-[#2E7D4E]">✓ 현재</span>
                            )}
                          </h3>
                          {club.description && (
                            <p className="text-sm text-gray-600 mt-1">{club.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            {roleLabels[clubMember.role]}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              {clubMember.role === 'owner' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEditClub(club)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    클럽 수정
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClub(club)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    클럽 삭제
                                  </DropdownMenuItem>
                                </>
                              )}
                              {clubMember.role !== 'owner' && (
                                <DropdownMenuItem
                                  onClick={() => handleLeaveClub(club)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <LogOut className="w-4 h-4 mr-2" />
                                  클럽 탈퇴
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">코드: {club.code}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode(club.code);
                          }}
                          className="text-xs text-[#2E7D4E] hover:underline flex items-center gap-1"
                        >
                          {copiedCode === club.code ? (
                            <>
                              <Check className="w-3 h-3" />
                              복사됨
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              복사
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* 새 클럽 만들기 */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button
                className="h-auto py-6 bg-gradient-to-r from-[#D4765A] to-[#2E7D4E] hover:from-[#B85C3D] hover:to-[#1F5A35]"
              >
                <Plus className="w-5 h-5 mr-2" />
                새 클럽 만들기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 클럽 만들기</DialogTitle>
                <DialogDescription>
                  새로운 테니스 동아리 클럽을 생성합니다.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClub} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clubName">클럽 이름 *</Label>
                  <Input
                    id="clubName"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    required
                    placeholder="서울 테니스 클럽"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clubDescription">설명 (선택)</Label>
                  <Input
                    id="clubDescription"
                    value={clubDescription}
                    onChange={(e) => setClubDescription(e.target.value)}
                    placeholder="클럽에 대한 간단한 설명"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setError(null);
                      setClubName('');
                      setClubDescription('');
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={creating} className="flex-1">
                    {creating ? '생성 중...' : '생성하기'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* 클럽 코드로 가입 */}
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-auto py-6">
                <Users className="w-5 h-5 mr-2" />
                클럽 코드로 가입하기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>클럽 코드로 가입</DialogTitle>
                <DialogDescription>
                  클럽 관리자에게 받은 코드를 입력하세요.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoinClub} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clubCode">클럽 코드 *</Label>
                  <Input
                    id="clubCode"
                    value={clubCode}
                    onChange={(e) => setClubCode(e.target.value.toUpperCase())}
                    required
                    placeholder="ABC12345"
                    className="uppercase"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowJoinDialog(false);
                      setError(null);
                      setClubCode('');
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={joining} className="flex-1">
                    {joining ? '가입 중...' : '가입하기'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 클럽 수정 다이얼로그 */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>클럽 수정</DialogTitle>
              <DialogDescription>
                클럽 정보를 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateClub} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editClubName">클럽 이름 *</Label>
                <Input
                  id="editClubName"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  required
                  placeholder="서울 테니스 클럽"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClubDescription">설명 (선택)</Label>
                <Input
                  id="editClubDescription"
                  value={clubDescription}
                  onChange={(e) => setClubDescription(e.target.value)}
                  placeholder="클럽에 대한 간단한 설명"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setError(null);
                    setEditingClub(null);
                    setClubName('');
                    setClubDescription('');
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button type="submit" disabled={creating} className="flex-1">
                  {creating ? '수정 중...' : '수정하기'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

