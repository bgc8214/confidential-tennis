import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsSuperAdmin } from '../hooks/useIsSuperAdmin';
import { adminService } from '../services/adminService';
import { clubMemberService } from '../services/clubMemberService';
import type { ClubMember, UserProfile } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Shield, ShieldCheck, User, Crown, Search, UserPlus, Trash2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function AdminClubMembers() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading } = useIsSuperAdmin();
  const { toast } = useToast();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 검색
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && isSuperAdmin && clubId) {
      loadMembers();
    }
  }, [authLoading, isSuperAdmin, clubId]);

  const loadMembers = async () => {
    if (!clubId) return;

    try {
      setLoading(true);
      const data = await adminService.getClubMembersAsAdmin(parseInt(clubId));
      setMembers(data);
      setError(null);
    } catch (err) {
      setError('멤버 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (memberId: number, newRole: 'owner' | 'admin' | 'member') => {
    if (!confirm(`정말 권한을 변경하시겠습니까?`)) return;

    try {
      await clubMemberService.updateMemberRole(memberId, newRole);
      await loadMembers();
      toast({
        title: "권한 변경 완료",
        description: "멤버 권한이 변경되었습니다.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "권한 변경 실패",
        description: "권한 변경에 실패했습니다.",
      });
      console.error(err);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast({
        variant: "destructive",
        title: "이메일 입력 필요",
        description: "검색할 이메일을 입력하세요.",
      });
      return;
    }

    try {
      setSearching(true);
      const results = await adminService.searchUsersByEmail(searchEmail);
      setSearchResults(results);
      if (results.length === 0) {
        toast({
          title: "검색 결과 없음",
          description: "해당 이메일의 사용자를 찾을 수 없습니다.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "검색 실패",
        description: "사용자 검색에 실패했습니다.",
      });
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddUser = async (userId: string) => {
    if (!clubId) return;

    // 이미 클럽 멤버인지 확인
    if (members.some(m => m.user_id === userId)) {
      toast({
        variant: "destructive",
        title: "이미 멤버입니다",
        description: "이 사용자는 이미 클럽 멤버입니다.",
      });
      return;
    }

    try {
      await adminService.addUserToClub(parseInt(clubId), userId, 'member');
      await loadMembers();
      setSearchResults([]);
      setSearchEmail('');
      toast({
        title: "멤버 추가 완료",
        description: "새 멤버가 클럽에 추가되었습니다.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "멤버 추가 실패",
        description: "멤버 추가에 실패했습니다.",
      });
      console.error(err);
    }
  };

  const handleRemoveUser = async (memberId: number, userName: string) => {
    if (!confirm(`정말 ${userName} 님을 클럽에서 제거하시겠습니까?`)) return;

    try {
      await adminService.removeUserFromClub(memberId);
      await loadMembers();
      toast({
        title: "멤버 제거 완료",
        description: `${userName} 님이 클럽에서 제거되었습니다.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "멤버 제거 실패",
        description: "멤버 제거에 실패했습니다.",
      });
      console.error(err);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-5 h-5 text-yellow-600" />;
      case 'admin':
        return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      default:
        return 'Member';
    }
  };

  const getRoleBadge = (role: string) => {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (role) {
      case 'owner':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'admin':
        return `${baseClass} bg-blue-100 text-blue-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center">로딩 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>접근 권한 없음</CardTitle>
            <CardDescription>슈퍼 어드민 권한이 필요합니다.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="outline"
        onClick={() => navigate('/admin')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        모든 클럽으로 돌아가기
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-red-600" />
                <span>클럽 멤버 관리 (슈퍼 어드민)</span>
              </CardTitle>
              <CardDescription>
                클럽 ID: {clubId} - 모든 멤버의 권한을 변경할 수 있습니다.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 font-medium">
              ⚠️ 슈퍼 어드민 권한으로 접근 중입니다. 신중하게 작업하세요.
            </p>
          </div>

          {/* 사용자 검색 및 추가 섹션 */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <UserPlus className="w-5 h-5" />
              <span>새 멤버 추가</span>
            </h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="이메일로 사용자 검색..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={searching}>
                <Search className="w-4 h-4 mr-2" />
                {searching ? '검색 중...' : '검색'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">검색 결과:</p>
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium">{user.full_name || '이름 없음'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <Button onClick={() => handleAddUser(user.id)} size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      추가
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 현재 멤버 목록 */}
          {members.length === 0 ? (
            <p className="text-gray-500 text-center py-8">멤버가 없습니다.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead className="text-right">권한 변경</TableHead>
                  <TableHead className="text-right">제거</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(member.role)}
                        <span>{member.user_profile?.full_name || '이름 없음'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.user_profile?.email || '-'}</TableCell>
                    <TableCell>
                      <span className={getRoleBadge(member.role)}>
                        {getRoleLabel(member.role)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(member.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={member.role}
                        onValueChange={(value: 'owner' | 'admin' | 'member') =>
                          handleRoleChange(member.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveUser(member.id, member.user_profile?.full_name || '이름 없음')}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        제거
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
