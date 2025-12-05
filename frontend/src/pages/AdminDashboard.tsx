import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsSuperAdmin } from '../hooks/useIsSuperAdmin';
import { adminService } from '../services/adminService';
import type { Club } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Settings, Users, Calendar, ChevronRight } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: authLoading } = useIsSuperAdmin();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      loadClubs();
    }
  }, [authLoading, isSuperAdmin]);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllClubs();
      setClubs(data);
      setError(null);
    } catch (err) {
      setError('클럽 목록을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageClub = (clubId: number) => {
    navigate(`/admin/clubs/${clubId}/members`);
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
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-6 h-6" />
              <span>시스템 관리</span>
            </CardTitle>
            <CardDescription>슈퍼 어드민 권한이 필요합니다.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-red-600" />
            <span>시스템 관리 - 모든 클럽</span>
          </CardTitle>
          <CardDescription>
            슈퍼 어드민 전용: 모든 클럽의 정보와 멤버를 관리할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-900 font-medium">
              ⚠️ 주의: 슈퍼 어드민 권한으로 모든 클럽의 데이터에 접근하고 있습니다.
            </p>
          </div>

          {clubs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">생성된 클럽이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                총 {clubs.length}개 클럽
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>클럽명</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead>멤버 수</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead className="text-right">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clubs.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-[#2E7D4E]" />
                          <span>{club.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {club.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{club.member_count || 0}명</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(club.created_at).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManageClub(club.id)}
                        >
                          멤버 관리
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
