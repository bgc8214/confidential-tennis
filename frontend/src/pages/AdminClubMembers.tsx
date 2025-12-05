import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIsSuperAdmin } from '../hooks/useIsSuperAdmin';
import { adminService } from '../services/adminService';
import { clubMemberService } from '../services/clubMemberService';
import type { ClubMember } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, ShieldCheck, User, Crown } from 'lucide-react';

export default function AdminClubMembers() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading } = useIsSuperAdmin();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      alert('권한 변경에 실패했습니다.');
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
