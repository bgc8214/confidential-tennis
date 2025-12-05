import { useState, useEffect } from 'react';
import { useClub } from '../contexts/ClubContext';
import { useClubPermissions } from '../hooks/useClubPermissions';
import { clubMemberService } from '../services/clubMemberService';
import type { ClubMember } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, ShieldCheck, User, Crown } from 'lucide-react';

export default function ClubMembers() {
  const { currentClub } = useClub();
  const { canManageRoles } = useClubPermissions();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentClub) {
      loadMembers();
    }
  }, [currentClub]);

  const loadMembers = async () => {
    if (!currentClub) return;

    try {
      setLoading(true);
      const data = await clubMemberService.getClubMembers(currentClub.id);
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
    if (!canManageRoles) {
      alert('권한이 없습니다.');
      return;
    }

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

  if (!currentClub) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">클럽을 선택해주세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageRoles) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-6 h-6" />
              <span>클럽 멤버 관리</span>
            </CardTitle>
            <CardDescription>권한이 없습니다. Owner만 접근 가능합니다.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
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

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-6 h-6" />
            <span>클럽 멤버 관리</span>
          </CardTitle>
          <CardDescription>
            클럽에 가입한 사용자들의 권한을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

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
                  {canManageRoles && <TableHead className="text-right">관리</TableHead>}
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
                    {canManageRoles && (
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
                    )}
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
